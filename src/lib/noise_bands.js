'use strict';

import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable';
import Drawable from './drawable';

import { SimplexFill } from './fills';

import { choose, hsvts, rank_contrast, nrand } from './utils';
import { rescale, rnd_range } from './utils';

const TAU = Math.PI * 2;

class NoiseLine extends Actionable {
  // draws a decal on the screen
  constructor(options) {
    // build the decal
    const opts = options || {};
    super(opts);

    this.line_width = opts.line_width || 0.001;
    this.dot_size = opts.dot_size || 0.001;
    this.fill = opts.fill || 0.1;
    this.simplex = opts.simplex || false;
    this.scale = opts.scale || 0.1;
    this.colours = opts.colours || [];
    this.cell_w = opts.cell_w || 0.1;
    this.cell_h = opts.cell_h || 0.1;
    this.cell_pad = opts.cell_pad || 0.05;
    this.cols = opts.cols || 5;
    this.colour_weights = opts.colour_weights || [0.2, 0.2];
  }

  line(ctx, colour, x, y, w, h) {
    // draws a line
    const {width, height, dot_size } = this;

    // const r = radius;
    const pts = [];
    // create two endpoints
    pts.push({x, y});
    pts.push({x: x+w, y});

    const passes = h / dot_size;
    const mv = dot_size;

    ctx.fillStyle = hsvts(colour);

    for (let p = 0; p < passes; p++) {
      // do a pass on the circle

      for (let v = 0; v < pts.length; v++) {
        // go through all of the vertices
        const p1 = (v == 0) ? pts[pts.length-1] : pts[v-1];
        const p2 = pts[v];

        const pdx = p2.x - p1.x;
        const pdy = p2.y - p1.y;

        const p1p2_dist = Math.sqrt(pdx * pdx + pdy * pdy);
        const no_dots = p1p2_dist / dot_size * this.fill;

        // draw the bunch of dots.
        for (let d = 0; d < no_dots; d++) {
          const t = Math.random();
          const dx = p1.x + t * pdx;
          const dy = p1.y + t * pdy;

          const ds = dot_size;

          ctx.beginPath();
          ctx.moveTo(dx * width, dy * height);
          ctx.arc(dx * width, dy * height, ds * width, 0, TAU);
          ctx.fill();
        }
      }

      for (let v = 0; v < pts.length; v++) {
        pts[v].y = pts[v].y + mv;
      }
    }
  }

  draw(ctx, colour, ...rest) {
    const {width, height, scale, dot_size, cell_h, cell_w, cell_pad } = this;

    const s = scale;
    const r_h = cell_h - (2 * cell_pad * cell_h);
    const top = cell_pad * cell_h;
    const left = cell_pad * cell_w;

    super.draw(ctx);
    // draw the line
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    for (let c = 0; c < this.cols; c++) {
      const cx = c * cell_w;
      const cy = top;

      // determine number of cells to do
      let cells = 1;
      const chance = Math.random();
      if (chance < 0.2) {
        cells = 2;
      } else if (chance > 0.8) {
        cells = 3;
      }

      // recalculate if we don't have enough left in the row.
      const cells_left = this.cols - (c) - cells;
      if (cells_left <= 0) {
        cells = cells + cells_left;
      }

      // figure out what the width in total would be now.
      const c_w = (cells * cell_w) - (2 * cell_pad * cell_w);

      // choose a colour
      let clr = colour;
      if (Math.random() < this.colour_weights[0]) {
        clr = this.colours[1];
      } else if (Math.random() > (this.colour_weights[1])) {
        clr = this.colours[2];
      }

      this.line(ctx, clr, cx, top, c_w, r_h);

      if (cells >= 0) {
        c = c + cells - 1;
      }
    }

    ctx.restore();
  }
}

export default class NoiseBands extends Drawable {
  // draws some lines of bands using noise fills
  constructor(options) {
    // build a new masked dots.

    const opts = options || {};
    opts.name = 'noisebands';
    opts.border = 0.05;
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
    const width = this.w();
    const height = this.h();
    this.simplex = new SimplexNoise();

    const rows = choose([11, 13, 17, 19, 23, 29]);
    const cols = 101; // choose([11, 13, 17, 19, 23, 29]);

    const cell_w = (1.0 - (2 * this.border)) / cols;
    const cell_h = (1.0 - (2 * this.border)) / rows;
    const cell_pad = rnd_range(0.05, 0.1);

    console.log(rows, cols, cell_pad);

    for (let r = 0; r < rows; r++) {
      // go through each row and draw the line out.

      this.enqueue(new NoiseLine({
        alpha: rnd_range(0.5, 0.8),
        width, height,
        translate: {x: this.border, y: r * cell_h + this.border},
        fill: rnd_range(0.05, 0.2),
        colour_weights: [rnd_range(0.1,0.4), rnd_range(0.6, 0.9)],
        dot_size: 0.001,
        cell_h, cell_w, cell_pad,
        rows, cols,
        simplex: this.simplex,
        scale: 0.5,
        colours: opts.fgs,
        t: r
      }), opts.fg);
    }

    super.execute(opts);
  }
}


