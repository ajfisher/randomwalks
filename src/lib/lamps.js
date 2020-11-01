'use strict';

import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable.js';
import Drawable from './drawable.js';

import { BlockMask } from './masks/index.js';
import { Dots } from './masked_dots.js';

import { choose, hsvts, rank_contrast, nrand } from './utils.js';
import { rescale, rnd_range } from './utils.js';

const TAU = Math.PI * 2;

class Lamp extends Actionable {
  // draws a lamp
  constructor(options) {
    // build the light source
    const opts = options || {};
    super(opts);

    this.l_width = opts.l_width || 0.1;
    this.l_height = opts.l_height || 0.1;
  }

  draw(ctx, colour, ...rest) {
    const {width, height, l_width, l_height} = this;
    super.draw(ctx);

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = hsvts(colour);

    ctx.beginPath();
    const lh = l_height * height;
    const lw = l_width * width;
    ctx.rect(-0.5*lw, -0.5*lh, lw, lh);
    ctx.fill();

    ctx.strokeStyle = hsvts(colour);
    ctx.lineWidth = 0.15 * lh;
    ctx.beginPath();
    ctx.moveTo((0 - this.translate.x) * 0.5 * width, 0);
    ctx.lineTo((1 - this.translate.x) * 0.5 * width, 0);
    ctx.stroke();

    ctx.restore();
  }
}


export default class Lamps extends Drawable {
  // draws a bunch of dots masked by a poly
  constructor(options) {
    // build a new masked dots.

    const opts = options || {};
    opts.name = 'lamps';
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
    const width = this.w();
    const height = this.h();
    // this.simplex = new SimplexNoise();

    const centre = {
      x: choose([0.37, 0.5, 0.67]),
      y: choose([0.67, 0.67])
    };

    centre.x = rnd_range(0.8, 1.2) * centre.x;
    centre.y = rnd_range(0.8, 1.2) * centre.y;

    const l_width = 0.15;
    const l_height = 0.01;
    const min = 0.0005;
    const max = 0.001;

    const d1_min = rnd_range(0.9, 2.1) * min;
    const d1_max = rnd_range(1.1, 3.0) * d1_min;

    this.enqueue(new Dots({
      alpha: 1.0,
      width, height,
      centre,
      tightness_x: l_width * 0.25,
      tightness_y: 0.065,
      direction: {x: Dots.ANY, y: Dots.UP},
      min: d1_min,
      max: d1_max,
      no: choose([1000, 2000, 3000])
    }), choose(opts.fgs));

    this.enqueue(new Dots({
      alpha: 1.0,
      width, height,
      centre,
      tightness_x: l_width * 0.25,
      tightness_y: 0.015,
      direction: {x: Dots.ANY, y: Dots.DOWN},
      min, max,
      no: choose([5000, 10000])
    }), choose(opts.fgs));

    this.enqueue(new Lamp({
      alpha: 1.0,
      width, height,
      translate: centre,
      l_height, l_width
    }), opts.fg);

    super.execute(opts);
  }
}

