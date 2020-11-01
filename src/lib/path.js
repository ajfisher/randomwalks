'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';

import { choose, rnd_range } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';

const TAU = Math.PI * 2;

class Pass extends Actionable {
  constructor(options) {
    // take a series of points and then draw a line across them
    const opts = options || {};
    super(opts);

    this.cols = opts.cols || 1;
    this.rows = opts.rows || 1;
    this.cell_w = 1.0 / this.cols;
    this.cell_h = 1.0 / this.rows;
    this.cells = opts.cells || [];
    this.line_width = opts.line_width || 0.01;
    this.dot_size = opts.dot_size || 0.05;
    this.simplex = opts.simplex || false;
    this.colours = opts.colours || [];
  }

  draw(ctx, colour, ...rest) {
    // draw the line

    const { width, height, cells, cell_w, cell_h, translate } = this;

    ctx.save();
    ctx.translate(translate.x, translate.y);
    const scale = 0.001;

    ctx.globalAlpha = this.alpha;
    ctx.lineWidth = this.line_width * width;
    ctx.strokeStyle = hsvts(choose(this.colours));
    ctx.fillStyle = hsvts(choose(this.colours));

    const c_xc = 0.5 * cell_w;
    const c_maxw = 0.9 * cell_w;
    const c_yc = 0.5 * cell_h;
    const c_maxh = 0.9 * cell_h;
    const h = c_maxw / 2;

    for (let r = 0; r < this.rows; r++) {
      const pyc = r * cell_h + c_yc;
      for (let c = 0; c < this.cols; c++) {
        // make a random choice about the sides of a polygon

        let sides = choose([3, 5]);
        if ( r > 0.4 * this.cols) {
          sides = choose([0, 3, 5, 7]);
        } else if ( r > 0.7 * this.cols) {
          sides = choose([0, 0, 5, 7]);
        }

        const fill = choose([false, true, true]);
        const clr = choose(this.colours);

        const rotation = this.simplex.noise2D(r * scale, c * scale);
        const pxc = c * cell_w + c_xc;
        ctx.save();
        ctx.translate(pxc * width, pyc * height);
        ctx.rotate(rotation * TAU);

        ctx.fillStyle = hsvts(clr);
        ctx.strokeStyle = hsvts(clr);

        // total radians available
        const total_angle = (sides - 2) * Math.PI;
        const angle = TAU / sides;
        ctx.beginPath()
        for (let s = 0; s < sides; s++) {
          // draw the sides

          // sometimes, introduce a bug
          if (Math.random() < 0.5 * ((c + r) / (this.cols + this.rows) )) {
            const nh = h * rnd_range(0.3, 0.7);
            const na = angle * rnd_range(0.4, 0.6);
            const ny = Math.sin(angle * (s-1) + na) * nh;
            const nx = Math.cos(angle * (s-1) + na) * nh;
            ctx.lineTo(nx * width, ny * height);
          }

          // draw the main point now
          // SOH CAH TOA
          const sy = Math.sin(angle * s) * h;
          const sx = Math.cos(angle * s) * h;
          ctx.lineTo(sx * width, sy * height);
        }
        ctx.closePath();
        if (fill) {
          ctx.fill();
        } else {
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    /**
    ctx.lineWidth = 1;
    // draw the grid
    for (let r = 0; r < this.rows; r++) {
      const y = this.cell_h * r;
      ctx.beginPath();
      ctx.moveTo(0, y * height);
      ctx.lineTo(width, y * height);
      ctx.stroke();
    }

    for (let c = 0; c < this.cols; c++) {
      const x = this.cell_w * c;
      ctx.beginPath();
      ctx.moveTo(x * width, 0);
      ctx.lineTo(x * width, height);
      ctx.stroke();
    }
    **/
    ctx.restore();
  }
}

export default class Path extends Drawable {
  // create a path which flows through a grid and lays down sort of ant
  // style pheremones which drive the flow forward.

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'path';
    opts.border = 0.04;
    super(opts);
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

    // add the specific drawing actions now
    const palette = this.palette;

    const { bg, fgs } = rank_contrast(palette);

    opts.bg = bg; // [47, 6, 100];
    opts.fg = fgs[0];
    opts.fgs = fgs;

    // get the basic dimensions of what we need to draw
    const border = Math.floor(this.w(this.border));
    const width = this.w() - 2 * border;
    const height = this.h()- 2 * border;

    this.cells = choose([13, 17, 19, 23, 29]);
    this.cols = this.cells;
    this.rows = this.cells;
    const lw = 0.001;

    this.simplex = new SimplexNoise();

    for (let i = 0; i < 1; i++) {
      this.enqueue(new Pass({
        alpha: 1.0,
        width, height,
        translate: {x: border, y: border},
        cols: this.cols,
        rows: this.rows,
        simplex: this.simplex,
        colours: opts.fgs,
        line_width: lw,
        t: i
      }), opts.fg);
    }

    super.execute(opts);
  }
}
