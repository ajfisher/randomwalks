'use strict';

import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable.js';
import Drawable from './drawable.js';

import { BlockMask, InvertedSquareMask, LineMask } from './masks/index.js';

import { choose, hsvts, rank_contrast, nrand } from './utils.js';
import { rescale, rnd_range } from './utils.js';

const TAU = Math.PI * 2;

export class Dots extends Actionable {
  // draws the dots to the canvas, with the mask
  constructor(options) {
    const opts = options || {};

    super(opts);

    this.no_dots = opts.no || 10;
    this.post_mask_dots = opts.post_mask_dots || 0.02;
    this.min = opts.min || 0.001;
    this.max = opts.max || 0.006;
    this.centre = opts.centre || {x: 0.5, y: 0.5};
    this.tightness = opts.tightness || 0.2;
    this.tightness_x = opts.tightness_x || this.tightness;
    this.tightness_y = opts.tightness_y || this.tightness;
    // this.simplex = opts.simplex;
    this.mask = opts.mask || false;
    this.direction = opts.direction || {x: Dots.ANY, y: Dots.ANY};
    this.over_dots = Math.floor(this.no_dots * this.post_mask_dots);
  }

  dot(ctx, colour, ...rest) {
    // gets a dot and draws it to the context
    const {centre, direction, min, max, scale} = this;

    let x = nrand(centre.x, this.tightness_x);
    if (direction.x === Dots.LEFT && x > centre.x) {
      x = centre.x - Math.abs(x);
    } else if (direction.x === Dots.RIGHT && x < centre.x) {
      x = centre.x + Math.abs(x);
    }

    let y = nrand(centre.y, this.tightness_y);
    if (direction.y === Dots.UP && y > centre.y) {
      y = centre.y; // - Math.abs(y);
    } else if (direction.y === Dots.DOWN && y < centre.y) {
      y = centre.y; // + Math.abs(y);
    }

    const dot_size = rnd_range(min, max) * this.width;

    ctx.fillStyle = hsvts(colour);
    // TODO use the shadow colour and blur to create glowy dots
    // ctx.shadowColor = hsvts([colour[0], 100.0, colour[2]]);
    // ctx.shadowBlur = dot_size * 5;
    // TODO use a soft mask to determine whether we can draw here or not.
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(x*this.width, y*this.height, dot_size, 0, TAU);
    ctx.fill();
    ctx.shadowColor = 'transparent';
  }

  draw(ctx, colour, ...rest) {
    // callback to execute the drawing

    ctx.save();
    // TODO potentially use a soft mask on here.
    if (this.mask) {
      this.mask.clip(ctx);
    }

    for (let d = 0; d < this.no_dots - this.over_dots; d++) {
      this.dot(ctx, colour);
    }
    if (this.mask) {
      ctx.restore();
    }

    for (let od = 0; od < this.over_dots; od++) {
      this.dot(ctx, colour);
    }
  }
}

// define some static vals
Dots.ANY = 0;
Dots.LEFT = -1;
Dots.RIGHT = 1;
Dots.UP = -1;
Dots.Down = 1;

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

    const max_lines = rnd_range(1, 5);

    for (let i = 0; i < max_lines; i++) {
      const centre = {
        x: choose([0.37, 0.5, 0.67]),
        y: choose([0.37, 0.5, 0.67])
      };

      /**
      const r = rnd_range(0.15, 0.3);
      const ism = new InvertedSquareMask({width, height, r_w: r, r_h: r});
      **/

      const bm = new BlockMask({
        width,
        height,
        translate: centre,
        rotate: Math.random() * TAU
      });

      const lm = new LineMask({
        width, height, translate: centre, rotate: Math.random() * TAU,
        line_width: 2.0,
        line_height: rnd_range(0.05, 0.25)
      });

      this.enqueue(new Dots({
        alpha: 0.5,
        width,
        height,
        // simplex: this.simplex,
        centre,
        tightness: rnd_range(0.1, 0.4),
        // tightness_x: rnd_range(0.01, 0.05),
        no: choose([1000, 3000, 5000, 10000]),
        mask: lm,
        post_mask_dots: rnd_range(0.01, 0.02)
      }), opts.fgs[i % 4]);
    }

    super.execute(opts);
  }
}
