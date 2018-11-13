'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable';

import { Actionable } from './actions';

import { CircleGridMask } from './masks';
import { CircleFrame } from './primatives';

import { choose, rnd_range } from './utils/random';
import { hsvts, rank_contrast } from './utils/draw';

class SimplexBand extends Actionable {
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.lines = opts.no_lines || 100;
    this.line_width = opts.line_width || 5;
    this.max = opts.max || 0.3;

    this.simplex = opts.simplex || false;
    this.scale = opts.scale || 1.5;
    this.ribbon_height = opts.ribbon_height || 0.005;

    if (typeof(opts.mask) === 'undefined') {
      this.mask = false;
    } else {
      this.mask = opts.mask;
    }
  }

  draw(ctx, colour, ...rest) {
    // draws the band of colour.
    const { height, width, line_width, max } = this;

    if (this.mask) {
      this.mask.clip(ctx);
    }

    const xt = this.translate.x * this.width;
    const yt = this.translate.y * this.height;

    const mv = 0.01;
    const s = this.scale;
    const rh = this.ribbon_height;

    ctx.save();
    ctx.translate(xt, yt);
    ctx.globalAlpha = this.alpha;

    let y = 0;

    ctx.fillStyle = hsvts(colour);
    ctx.beginPath();
    ctx.moveTo(0, 0);

    const ypts = [0];

    // we should now be at the point where we can start drawing.
    for (let l = 0; l < this.lines; l++) {
      // move along the x axis by line width at a time and then plot the new
      // line.
      const noise = this.simplex.noise3D(l / this.lines * s, y * s, this.t * s);
      y = y + (noise * mv);
      if (y < -max) {
        y = -max;
      } else if (y > max) {
        y = max;
      }
      ctx.lineTo(l * line_width, y * height);
      ypts.push(y);
    }

    y = y + rh;

    ctx.lineTo(this.lines * line_width, y * height);

    for (let l = this.lines; l > 0; l--) {
      y = ypts[l] + rh;
      const noise = this.simplex.noise3D(l / this.lines * s, y * s, this.t * s);
      y = y + (noise * rh);

      ctx.lineTo(l * line_width, y * height);
    }

    ctx.fill();
    ctx.restore();
  }
}

export default class MultiBands extends Drawable {
  // flow field drives a set of particles across a field of simplex noise
  // arranged in a grid which will use some basic physics to manipulate their
  // direction of travel. As they draw, this will result in visible flow lines
  // across the field.

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'simplexbands';
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
    const width = this.w(); // - 2 * border;
    const height = this.h(); // - 2 * border;

    this.simplex = new SimplexNoise();

    const available_colours = opts.fgs.length - 1; // remove FG and BG
    const no_lines = 100;
    const line_width = Math.ceil((this.w()-border) / no_lines);

    const scale = rnd_range(1, 10); // choose([1.5, 1.0, 4, 2, 2.5]);
    const ribbon_height = rnd_range(0.005, 0.035);
    const ribbons = available_colours;

    const rows = 23;
    const cols = rows;
    const cell_size = (1.0 - (2 * this.border)) / cols;
    const circle_size = 0.92 * cell_size;
    const rad = 0.5 * circle_size;
    const band_max = 1.4; // * rows * circle_size;

    console.log(scale, ribbons, line_width, ribbon_height);

    const mask = new CircleGridMask({
      translate: {x: this.border, y: this.border},
      radius: rad,
      cell_size,
      rows, cols,
      width, height
    });

    for (let r = 0; r < rows; r++) {
      for (let i = 0; i < ribbons; i++) {
        const band = (i % available_colours);
        const y = (this.border + 0.5 * cell_size) + (r * cell_size);

        this.enqueue(new SimplexBand({
          alpha: (r+1) / rows,
          width, height,
          no_lines, line_width,
          max: band_max,
          ribbon_height,
          translate: { x: 0, y },
          mask,
          simplex: this.simplex,
          scale,
          t: r * ribbons + i
        }), opts.fgs[band]);
      }
    }

    // add the circle frames
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const position = {
          x: this.border + (c * cell_size) + (0.5 * cell_size),
          y: this.border + (r * cell_size) + (0.5 * cell_size)
        };

        this.enqueue(new CircleFrame({
          alpha: 0.3,
          width, height,
          translate: position,
          radius: rad,
          line_width: 0.001,
          t: 0
        }), opts.fg);
      }
    }

    super.execute(opts);
  }
}
