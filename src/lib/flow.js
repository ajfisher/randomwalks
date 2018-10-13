'use strict';

import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable';
import Drawable from './drawable';

import { choose, constrain, hsvts, rank_contrast } from './utils';
import { rescale, rnd_range } from './utils';

const TAU = Math.PI * 2;

class FlowGrid extends Actionable {
  // Draws a grid of items that represents the flow field.
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.cols = opts.cols;
    this.rows = opts.rows;
    this.cell_w = Math.round(this.width / this.cols);
    this.cell_h = Math.round(this.height / this.rows);
    this.simplex = opts.simplex;
    this.bg = opts.bg;
    this.colours = opts.colours;
  }

  draw(ctx, colour, ...rest) {
    // draws the grid.
    super.draw(ctx, colour);

    const hue = colour[0];

    const cw_h = this.cell_w * 0.5;
    const ch_h = this.cell_h * 0.5;

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const s = 0.05;
        const noise = this.simplex.noise2D(x * s, y * s);

        let h = hue + (noise * 60);
        if (h < 0) h = h + 360;

        ctx.save();
        ctx.translate(x * this.cell_w, y * this.cell_h);
        ctx.strokeStyle = hsvts([h, colour[1], colour[2]]);
        //  ctx.fillStyle = hsvts(colour);
        ctx.lineWidth = rnd_range(Math.round(0.1 * this.cell_w), cw_h);
        ctx.globalAlpha = 0.45;

        // draw the grid
        /**
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.cell_w, 0);
        ctx.lineTo(this.cell_w, this.cell_h);
        ctx.lineTo(0, this.cell_h);
        ctx.lineTo(0, 0);
        ctx.stroke();
        **/
        // draw a dot in the centre.
        // ctx.beginPath();
        // ctx.arc(cw_h, ch_h, 1, 0, Math.PI * 2)
        // ctx.fill();

        // draw a line from the middle, aligned to the flow field.
        ctx.save();
        ctx.translate(cw_h, ch_h);
        ctx.rotate(noise * Math.PI);

        ctx.beginPath();
        let ll = this.cell_w; // * 0.5;
        if (ll < cw_h) ll = cw_h;

        ctx.moveTo(-ll, 0);
        // ctx.lineTo(ll, 0);
        // ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = hsvts(choose(this.colours));
        ctx.globalAlpha = 0.5 + (noise * 0.4);
        ctx.arc(0, 0, 0.8*cw_h, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        // go back to the other space.
        ctx.restore();
      }
    }
  }
}

export default class FlowField extends Drawable {
  // flow field shows a field of simplex noise in a grid where you can see
  // the flow lines.

  constructor(options) {
    // build a new flow field.

    const opts = options || {};
    opts.name = 'flowfield';
    opts.border = 0.01;
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
    const height = this.h() - 2 * border;

    const cols = Math.round(width / 15);
    const rows = Math.round(height / 15);

    this.simplex = new SimplexNoise();

    this.enqueue(new FlowGrid({
      alpha: 1.0,
      width,
      height,
      translate: { x: border, y: border },
      rotate: 0,
      cols,
      rows,
      simplex: this.simplex,
      colours: opts.fgs,
      t: 1
    }), opts.fg);

    super.execute(opts);
  }
}
