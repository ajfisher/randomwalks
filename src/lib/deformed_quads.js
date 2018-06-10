'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { choose, hsvts, rand_range, weight_rnd } from './utils.js';

class Distortion {
  // creates an alpha blend distortion on the fg items of the
  // image
  constructor(x1, y1, x2, y2, bg) {
    this.bg = bg;
    this.x = Math.floor(x1);
    this.y = Math.floor(y1);
    this.w = Math.ceil(x2) - this.x;
    this.h = Math.ceil(y2) - this.y;
    this.simplex = new SimplexNoise();
  }

  draw(ctx) {
    const img_data = ctx.getImageData(this.x, this.y, this.w, this.h);
    const pdata = img_data.data;

    // figure out the bg colour and convert it to rgb for comparison
    let bg = space.hsv.rgb(this.bg);
    bg = bg.map((c) => Math.round(c));
    const v_max = 15;

    for (let x = 0; x < this.w; x++) {
      for (let y = 0; y < this.h; y++) {
        // walk the image, grab each pixel and then blend it based on a value
        // for the distortion map.
        const luma = this.simplex.noise2D(x, y);
        const p = y * (this.w * 4) + (x * 4);
        const rgb = [pdata[p], pdata[p+1], pdata[p+2]];

        // check if the px doesn't equal the bg. If it's not then we just
        // distort it up a little.
        if (rgb.toString() !== bg.toString()) {
          const px = space.rgb.hsv(rgb);
          px[2] = px[2] + Math.round(luma * v_max);
          px[2] = px[2] > 100 ? 100 : px[2]; // constrain if needed

          // now construct the new pixel value, cast it back to RGB vals
          let new_px = space.hsv.rgb(px);
          new_px = new_px.map((c) => Math.round(c));
          // write the pixel back to the original pixel data
          pdata[p] = new_px[0];
          pdata[p+1] = new_px[1];
          pdata[p+2] = new_px[2];
        }
      }
    }
    ctx.putImageData(img_data, this.x, this.y);
  }
}


class Grid {
  // overlays a grid on the space.
  constructor(opts) {
    for (const key in opts) {
      if (typeof(this[key]) === 'undefined') {
        this[key] = opts[key];
      }
    }
  }

  draw(ctx, colours) {
    // render the grid
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    for (let y = 0; y <= this.rows; y++) {
      const x1 = this.left_x;
      const x2 = this.left_x + this.total_w;
      const y1 = this.top_y + y * this.grid_h;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y1);
      ctx.stroke();
    }
    for (let x = 0; x <= this.cols; x++) {
      const x1 = this.left_x + x * this.grid_w;
      const y1 = this.top_y;
      const y2 = this.top_y + this.total_h;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1, y2);
      ctx.stroke();
    }
  }
}

class Quad {
  // a single quadrilateral is defined as a centre point and then
  // four vectors which are used to express the components leading
  // to the vertex.
  constructor(centre, vertices, fill=false, options) {
    // center is a 2d vector expressing x, y position
    // vertices are 2d vectors expressing the x and y components of the
    // vector leading from the centre.
    this.centre = centre;
    this.vertices = vertices;
    this.fill = fill;

    const opts = options || {};
    this.line_width = opts.line_width || 4;
    this.bg = opts.bg;
  }

  draw(ctx, colour) {
    // render the actual quadrilateral out
    const { centre, vertices } = this;

    ctx.fillStyle = hsvts(colour);
    ctx.strokeStyle = hsvts(colour);
    ctx.save();
    ctx.translate(centre[0], centre[1]);
    ctx.beginPath();
    ctx.moveTo(vertices[0][0], vertices[0][1]);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i][0], vertices[i][1]);
    }
    ctx.closePath();
    if (this.fill) {
      ctx.fill();
    } else {
      ctx.lineWidth = this.line_width;
      ctx.stroke();
    }
    ctx.restore();

    // get the bounding box for the quad
    let x1 = centre[0];
    let x2 = centre[0];
    let y1 = centre[1];
    let y2 = centre[1];
    vertices.forEach((vec, i) => {
      const v = [
        vec[0] + centre[0],
        vec[1] + centre[1]
      ];

      // do simple comparison to min / max the coords
      x1 = v[0] < x1 ? v[0] : x1;
      x2 = v[0] > x2 ? v[0] : x2;
      y1 = v[1] < y1 ? v[1] : y1;
      y2 = v[1] > y2 ? v[1] : y2;
    });

    const d = new Distortion(x1, y1, x2, y2, this.bg);
    d.draw(ctx);
  }
}

export default class DeformedQuads extends Drawable {
  // creates a set of deformed quadrilaterals
  // Deformed quadrilaterals creates a grid of quadrilaterals
  // that starts off sort of square-like but then the vertices
  // are pertubed a small amount on each iteration. This advances
  // in the X and Y planes of the grid to multiply the effect
  // through the progression.
  // a --- b
  // |     |
  // d --- c

  constructor(options) {
    super(options);

    const opts = options || {};
    this.rows = 23;
    this.cols = this.rows;
    this.simplex = new SimplexNoise(this.seed);
  }

  draw(seed, options) {
    // set off the drawing process.
    // `seed` provides a random seed as an `int` to use for recreation
    // `options` is an object which is inherited from `super` and
    // then any other options specific

    this.seed = parseInt(seed, 10) || null;
    const opts = options || {};

    // prep the object with all the base conditions
    super.init(opts);
    const palette = this.palette;
    // opts.bg = [60, 6, 100];
    opts.bg = [47, 6, 100];

    // in some fashion get a starting quad.
    // then take the vertices and then for each row, start deforming
    // them in the x axis as you go along the cols
    // then as you move to the next row, take the starting one from the
    // previous row and then deform the y coordinates.
    // In this way we could always consider a given quad to be a projection
    // of a starting quad plus a vector of deformations from that starting
    // quad. This will result in a new quad so you can feed this forward
    // into the next one, etc.
    // also need to work out how much a given quad is allowed to deform
    // before it starts overlapping the next grid.
    // Ideally you want them relatively tightly packed but with enough space
    // to show the deformations.
    // need to work out the size of the stroke as well which should be
    // a multiple of DPI and scalefactor.

    // work out the centre points of each grid point.
    // represent each of the points as a vector from the centre in order
    // to determine the outer points.
    // draw then from the outer points.
    // distort the actual vectors rather than the points.
    // vector is a matrix that is the x&y displacement from the centre
    // or could be an angle and a magnitude...

    const border = this.cm(1);
    const total_w = this.w() - 2 * border;
    const total_h = this.h() - 2 * border;
    const left_x = border;
    const top_y = border;
    const grid_w = total_w / this.cols;
    const grid_h = total_h / this.rows;
    const quad_w = 0.72 * grid_w; // quad_max_w;
    const quad_h = 0.72 * grid_h; // quad_max_h;
    const line_width = Math.floor(this.cm(0.1) / this.scale_factor);
    const max_d = 0.1 * grid_w;

    /**
    this.enqueue(new Grid({
      total_w, total_h, left_x, top_y, grid_w, grid_h,
      rows: this.rows, cols: this.cols
    }), palette[0]);
    **/
    const a = [-0.5, -0.5];
    const b = [ 0.5, -0.5];
    const c = [ 0.5,  0.5];
    const d = [-0.5,  0.5];

    for (let y = 0; y < this.rows; y++) {
      // walk the grid and draw quads as you go

      for (let x = 0; x < this.cols; x++) {
        // set up a row of quads

        let dvecs = [[0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0]];

        dvecs = dvecs.map((vec, i) => {
          const xd = vec[0] + this.simplex.noise4D(x, y, i, 0);
          const yd = vec[1] + this.simplex.noise4D(x, y, i, 1);
          return [xd, yd];
        });

        const cx = left_x + x * grid_w + 0.5 * grid_w;
        const cy = top_y + y * grid_h + 0.5 * grid_h;
        let vertices = [a, b, c, d];

        vertices = vertices.map((vtx, i) => {
          return [
            vtx[0] * quad_w + dvecs[i][0] * max_d,
            vtx[1] * quad_h + dvecs[i][1] * max_d
          ];
        });

        const fill = weight_rnd([true, false, null ], [50, 35, 15]);
        const colour = choose(palette);

        if (fill != null) {
          this.enqueue(new Quad([cx, cy], vertices, fill,
            {line_width, bg: opts.bg}), colour);
        }
      }
    }

    super.execute(opts);
  }
}
