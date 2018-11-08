'use strict';

import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable';
import Drawable from './drawable';

import { choose, hsvts, rank_contrast, nrand } from './utils';
import { rescale, rnd_range } from './utils';

const TAU = Math.PI * 2;

class Mask {
  // provides the mask that is needed
  constructor(options) {
    // build a new mask
    const opts = options || {};
    this.height = opts.height;
    this.width = opts.width;
  }

  draw(ctx) {
    // abstract interface for the mask drawing actions.
  }
}

class BlockMask extends Mask {
  // creates a mask that basically creates a line going through
  // the canvas
  constructor(options) {
    const opts = options || {};

    super(opts);
  }
  draw(ctx) {
  }
}

class InvertedSquareMask extends Mask {
  // creates a mask that is an inversion of a square
  constructor(options) {
    const opts = options || {};
    super(opts);
    this.r_w = opts.r_w || 0.4;
    this.r_h = opts.r_h || 0.4;
  }

  draw(ctx) {
    // draw the various parts of the clipping path
    super.draw(ctx);
    const { width, height, r_w, r_h } = this;

    const outer_h = (1.0 - r_h) / 2;
    const outer_w = (1.0 - r_w) / 2;

    ctx.beginPath();
    ctx.rect(0, 0, width, outer_h * height);
    ctx.rect(0, (r_h + outer_h) * height, width, outer_h * height);
    ctx.rect(0, 0, outer_w * width, height);
    ctx.rect((r_w + outer_w) * width, 0, outer_w * width, height);
    ctx.clip();
  }
}

class Dots extends Actionable {
  // draws the dots to the canvas, with the mask
  constructor(options) {
    const opts = options || {};

    super(opts);

    this.no_dots = opts.no || 10;
    this.min = 0.001;
    this.max = 0.006;
    this.centre = opts.centre || {x: 0.5, y: 0.5};
    this.tightness = opts.tightness || 0.2;
    this.simplex = opts.simplex;
    this.mask = opts.mask;
    this.over_dots = Math.floor(this.no_dots * 0.02);
  }

  dot(ctx, colour, ...rest) {
    // gets a dot and draws it to the context
    const {centre, min, max, scale} = this;

    const x = nrand(centre.x, this.tightness);
    const y = nrand(centre.y, this.tightness);
    const dot_size = rnd_range(min, max) * this.width;

    ctx.fillStyle = hsvts(colour);
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(x*this.width, y*this.height, dot_size, 0, TAU);
    ctx.fill();
  }

  draw(ctx, colour, ...rest) {
    // callback to execute the drawing

    ctx.save();
    this.mask.draw(ctx);

    for (let d = 0; d < this.no_dots - this.over_dots; d++) {
      this.dot(ctx, colour);
    }

    ctx.restore();

    for (let od = 0; od < this.over_dots; od++) {
      this.dot(ctx, colour);
    }
  }
}

export default class MaskedDots extends Drawable {
  // draws a bunch of dots masked by a poly
  constructor(options) {
    // build a new masked dots.

    const opts = options || {};
    opts.name = 'maskedDots';
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

    const r = rnd_range(0.15, 0.3);

    this.enqueue(new Dots({
      alpha: 0.5,
      width,
      height,
      simplex: this.simplex,
      centre: {
        x: choose([0.37, 0.5, 0.67]),
        y: choose([0.37, 0.5, 0.67])
      },
      tightness: rnd_range(0.1, 0.3),
      no: 10000,
      mask: new InvertedSquareMask({width, height, r_w: r, r_h: r})
    }), opts.fg);

    super.execute(opts);
  }
}
