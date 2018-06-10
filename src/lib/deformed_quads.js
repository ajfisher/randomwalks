'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { hsvts, rand_range } from './utils.js';

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
    console.log('drawing the grid');
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
      console.log(x1, y1, x1, y2);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1, y2);
      ctx.stroke();
    }
  }
}

class Quad {
  // a single quadrilateral defined as a set of vertices
  constructor(vertices, colour=[0, 0, 0], fill=false, options) {
    // pass in a bunch of veritce
    this.vertices = vertices;
    this.colour = colour;
  }

  draw(ctx, colours) {
    // render the actual quadrilateral out
    const { vertices } = this;

    // console.log(this, vertices);

    ctx.fillStyle = hsvts(this.colour);
    ctx.strokeStyle = hsvts(this.colour);
    ctx.beginPath();
    ctx.moveTo(vertices[0][0], vertices[0][1]);
    ctx.lineTo(vertices[1][0], vertices[1][1]);
    ctx.lineTo(vertices[2][0], vertices[2][1]);
    ctx.lineTo(vertices[3][0], vertices[3][1]);
    ctx.closePath();
    // ctx.lineTo(vertices[0][0], vertices[0][1]);
    ctx.lineWidth = 4;
    ctx.stroke();
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
    this.rows = 19;
    this.cols = 19;
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
    // opts.bg = [46, 11, 94];
    // opts.bg = [50, 5, 95];
    opts.bg = [60, 6, 100];
    // opts.bg = [71, 13, 96];
    // now execute the drawing.

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
    const gtr = 0.025 * grid_w; // gutter between grids is 2.5% of grid w
    const quad_max_w = grid_w - 2 * gtr;
    const quad_max_h = grid_h - 2 * gtr;
    const quad_w = 0.67 * quad_max_w;
    const quad_h = 0.67 * quad_max_h;
    const max_deform = (quad_max_w - quad_w) / quad_max_w;
    const neg_max_deform = 0.5 % max_deform * -1;
    const s_d = 0.25 * max_deform; // starting deform max
    const s_n_d = 0.25 * neg_max_deform; // starting negative deform max

    this.enqueue(new Grid({
      total_w, total_h, left_x, top_y, grid_w, grid_h,
      rows: this.rows, cols: this.cols
    }), palette[0]);

    let rvecs = [ [0,0], [0,0], [0,0], [0,0] ];
    let dvecs = [ [0,0], [0,0], [0,0], [0,0] ];

    for (let y = 0; y < this.rows; y++) {
      // create the starting row vectors for deformation
      // const cvecs = [[0,0], [0,0], [0,0], [0,0]];
      // walk the y axis deformations
      let x = 0;

      rvecs = rvecs.map((vec, i) => {
        let xd = vec[0] + this.simplex.noise4D(x, y, i, 0) * s_d;
        let yd = vec[1] + this.simplex.noise4D(x, y, i, 1) * s_d;

        xd = xd < 0.5 * max_deform ? xd : max_deform;
        yd = yd < 0.5 * max_deform ? yd : max_deform;

        return [ xd, yd ];
      });

      // create the starting conditions for the row
      dvecs = rvecs.map((vec, i) => {
        return [ vec[0], vec[1] ]
      });

      for (x = 0; x < this.cols; x++) {
        // now walk along and create changes for the x axis
        dvecs.forEach((vec, i) => {
          let xd = vec[0] + this.simplex.noise4D(x, y, i, 0) * s_d;
          let yd =  vec[1] + this.simplex.noise4D(x, y, i, 1) * s_d;

          xd = xd < 0.5 * max_deform ? xd : max_deform;
          yd = yd < 0.5 * max_deform ? yd : max_deform;

          dvecs[i] = [xd, yd];
        });

        /**
        const a = [left_x + x * grid_w + gtr + dvecs[0][0]*quad_w, top_y + y * grid_h + gtr + dvecs[0][1]*quad_h];
        const b = [a[0] + quad_w + dvecs[1][0] * quad_w, a[1] + dvecs[1][1]*quad_h];
        const c = [b[0] + dvecs[2][0] * quad_w, b[1] + quad_h + dvecs[2][1] * quad_h];
        const d = [a[0] + dvecs[3][0] * quad_w, c[1] + dvecs[3][1] * quad_h];
        **/
        const a = [left_x + x * grid_w + gtr, top_y + y * grid_h + gtr];
        const b = [a[0] + quad_w, a[1]];
        const c = [b[0], b[1] + quad_h];
        const d = [a[0], c[1]];

        this.enqueue(new Quad([a, b, c, d]), palette[0] );
      }
    }

    super.execute(opts);
  }
}
