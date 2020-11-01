'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';

import { CircleMask } from './masks/index.js';
import { CircleFrame } from './primatives/index.js';

import { choose, rnd_range } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';

class SimplexBand extends Actionable {
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.radius = opts.radius || 0.5;
    this.lines = opts.no_lines || 100;
    this.line_width = opts.line_width || 5;
    this.band_width = opts.band_width || 0.25;

    this.simplex = opts.simplex || false;
    this.scale = opts.scale || 1.5;

    if (typeof(opts.mask) === 'undefined') {
      this.mask = false;
    } else {
      this.mask = opts.mask;
    }
  }

  draw(ctx, colour, ...rest) {
    // draws the band of colour.
    const { height, width, line_width } = this;

    if (this.mask) {
      this.mask.clip(ctx);
    }

    const xt = this.translate.x * this.width;
    const yt = this.translate.y * this.height;

    const mv = 0.05;

    ctx.save();
    ctx.translate(xt, yt);
    ctx.globalAlpha = this.alpha;

    let y = 0;

    ctx.fillStyle = hsvts(colour);
    ctx.beginPath();
    ctx.moveTo(0, 0);

    const s = this.scale;
    const max = 0.3;
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
    }

    y = y + this.band_width;

    ctx.lineTo(this.lines * line_width, y * height);
    for (let l = this.lines; l > 0; l--) {
      const noise = this.simplex.noise3D(l / this.lines * s, y * s, this.t * s);
      y = y + (noise * mv);
      if (y < -max) {
        y = -max;
      } else if (y > max) {
        y = max;
      }
      ctx.lineTo(l * line_width, y * height);
    }

    ctx.fill();
    ctx.restore();
  }
}

export default class SimplexBands extends Drawable {
  // flow field drives a set of particles across a field of simplex noise
  // arranged in a grid which will use some basic physics to manipulate their
  // direction of travel. As they draw, this will result in visible flow lines
  // across the field.

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'simplexbands';
    opts.border = 0.0;
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
    const centre = { x: 0.5, y: 0.5 };
    const radius = 0.4;
    const no_lines = 100;
    const line_width = Math.ceil(this.w(2*radius) / no_lines);
    const band_width = 2 * radius / available_colours;

    const band_y = [0.37, 0.5, 0.63, 0.5, 0.5];
    const scale = choose([1.5, 1.0, 4, 2, 2.5]);
    const passes = rnd_range(4, 16);

    console.log(scale, passes, line_width, available_colours);

    const mask = new CircleMask({
      translate: centre,
      radius,
      width, height
    });

    const sx = centre.x - radius;

    for (let i = 0; i < passes; i++) {
      const band = i % available_colours;
      const y = band_y[band]; // sy + (band * band_width) + 0.5 * band_width;
      this.enqueue(new SimplexBand({
        alpha: 1 - (passes / 16),
        width, height,
        radius: 0.41,
        no_lines, line_width, band_width,
        translate: { x: sx, y },
        mask,
        simplex: this.simplex,
        scale,
        t: i
      }), opts.fgs[band]);
    }

    this.enqueue(new CircleFrame({
      alpha: 0.8,
      width, height,
      translate: centre,
      radius,
      line_width: 0.01,
      t: 0
    }), opts.fg);

    super.execute(opts);
  }
}

