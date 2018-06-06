'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import Drawable from './drawable.js';

import { hsvts, rand_range } from './utils.js';

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
    this.rows = 13;
    this.cols = 13;
    this
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

    console.log(this);
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

    const total_w = this.w() - this.cm(2);
    const total_h = this.h() - this.cm(2);
    const left_x = this.cm(1);
    const top_y = this.cm(1);
    const grid_w = total_w / this.cols;
    const grid_h = total_h / this.rows;
    const gtr = 0.025 * grid_w; // gutter between grids
    const quad_max_w = grid_w - 2 * gtr;
    const quad_max_h = grid_h - 2 * gtr;
    const quad_w = 0.67 * quad_max_w;
    const quad_h = 0.67 * quad_max_h;
    const max_deform = (quad_max_w - quad_w) / quad_max_w;
    const neg_max_deform = 0.5 % max_deform * -1;
    const s_d = 0.15 * max_deform; // starting deform max
    const s_n_d = 0.15 * neg_max_deform; // starting negative deform max

    const dvecs = [
      [rand_range(s_n_d, s_d), rand_range(s_n_d, s_d)],
      [rand_range(s_n_d, s_d), rand_range(s_n_d, s_d)],
      [rand_range(s_n_d, s_d), rand_range(s_n_d, s_d)],
      [rand_range(s_n_d, s_d), rand_range(s_n_d, s_d)]
    ];

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const a = [left_x + x * grid_w + gtr + dvecs[0][0]*quad_w, top_y + y * grid_h + gtr + dvecs[0][1]*quad_h];
        const b = [a[0] + quad_w + dvecs[1][0] * quad_w, a[1] + dvecs[1][1]*quad_h];
        const c = [b[0] + dvecs[2][0] * quad_w, b[1] + quad_h + dvecs[2][1] * quad_h];
        const d = [a[0] + dvecs[3][0] * quad_w, c[1] + dvecs[3][1] * quad_h];

        this.enqueue(new Quad([a, b, c, d]), palette[0] );
      }
    }

    super.execute(opts);
  }
}
