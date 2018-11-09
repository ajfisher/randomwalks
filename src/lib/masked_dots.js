'use strict';

import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable';
import Drawable from './drawable';

import { BlockMask, InvertedSquareMask } from './masks';

import { choose, hsvts, rank_contrast, nrand } from './utils';
import { rescale, rnd_range } from './utils';

const TAU = Math.PI * 2;

class Dots extends Actionable {
  // draws the dots to the canvas, with the mask
  constructor(options) {
    const opts = options || {};

    super(opts);

    this.no_dots = opts.no || 10;
    this.post_mask_dots = opts.post_mask_dots || 0.02;
    this.min = 0.001;
    this.max = 0.006;
    this.centre = opts.centre || {x: 0.5, y: 0.5};
    this.tightness = opts.tightness || 0.2;
    this.simplex = opts.simplex;
    this.mask = opts.mask;
    this.over_dots = Math.floor(this.no_dots * this.post_mask_dots);
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
    this.mask.clip(ctx);

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

    const centre = {
      x: choose([0.37, 0.5, 0.67]),
      y: choose([0.37, 0.5, 0.67])
    };

    const ism = new InvertedSquareMask({width, height, r_w: r, r_h: r});
    const bm = new BlockMask({
      width,
      height,
      translate: centre,
      rotate: Math.random() * TAU
    });

    this.enqueue(new Dots({
      alpha: 0.5,
      width,
      height,
      simplex: this.simplex,
      centre,
      tightness: rnd_range(0.1, 0.3),
      no: 10000,
      mask: bm,
      post_mask_dots: rnd_range(0.01, 0.05)
    }), opts.fg);

    super.execute(opts);
  }
}
