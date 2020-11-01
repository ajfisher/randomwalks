'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';
// import { SimplexField } from './fields';
import { CircleMask } from './masks/index.js';
import { CircleFrame } from './primatives/index.js';

import { choose, rnd_range } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';

const TAU = Math.PI * 2;

class Circles extends Actionable {
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.no = opts.no || 50;
    this.lw_min = opts.lw_min || 0.01;
    this.lw_max = opts.lw_max || 0.03;
    this.mask = opts.mask;
  }

  draw(ctx, colour, ...rest) {
    this.mask.clip(ctx);

    const xt = this.translate.x * this.width;
    const yt = this.translate.y * this.height;

    ctx.save();
    ctx.translate(xt, yt);

    let r = 0.15;

    ctx.strokeStyle = hsvts(colour);
    ctx.globalAlpha = this.alpha;

    for (let c = 0; c < this.no; c++) {
      // iterate a number of times and draw the concentric rings

      let lw = rnd_range(this.lw_min, this.lw_max);
      if (r < 0.2) {
        lw = lw / 10;
      } else if (r < 0.4) {
        lw = lw / 5;
      } else if (r < 0.6) {
        lw = lw / 2;
      }

      ctx.lineWidth = lw * this.width;
      ctx.beginPath();
      ctx.arc(0, 0, r * this.width, 0, TAU);
      ctx.stroke();

      // determine the gap to the next ring
      const gap = 2 * lw;

      r = r + gap;
    }
    ctx.restore();
  }
}

export class ApplyGrain extends Actionable {
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.no = opts.no || 200;
    this.min = opts.min || 0.001;
    this.max = opts.max || 0.005;
    this.mask = opts.mask;
    this.colours = opts.colours || false;
  }

  draw(ctx, colour, ...rest) {
    // draws some grain dots over the canvas
    const { height, width, no, min, max } = this;

    if (typeof(this.mask) !== 'undefined') {
      this.mask.clip(ctx);
    }

    let ar_size = width;
    if (width > height) {
      ar_size = height;
    }

    ctx.save();
    ctx.globalAlpha = this.alpha;

    for (let d = 0; d < no; d ++) {
      // determine where the colour is coming from
      if (this.colours) {
        ctx.fillStyle = hsvts(choose(this.colours));
      } else {
        ctx.fillStyle = hsvts(colour);
      }

      // find a location for the dot.
      const x = Math.random() * width * 0.98;
      const y = Math.random() * height * 0.98;
      const r = rnd_range(0.5 * min, 0.5 * max) * ar_size;
      const w = rnd_range(min, max) * ar_size;
      const rot = Math.random() * TAU;


      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.rect(-0.5 * w, -0.5 * r, w, r);
      ctx.fill();
      ctx.restore();
      /**
      // draw the dot.
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
      **/
    }

    ctx.restore();
  }
}

class CircleFill extends Actionable {
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.radius = opts.radius || 0.4;
  }

  draw(ctx, colour, ...rest) {
    const {width, height, translate, radius} = this;

    ctx.save();
    ctx.fillStyle = hsvts(colour);
    ctx.globalAlpha = this.alpha;
    ctx.translate(translate.x*width, translate.y*height);
    ctx.beginPath()
    ctx.arc(0, 0, radius * width, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

export default class Concentrics extends Drawable {
  // Concentrics creates a set of concentric rings that play across the
  // surface of a central circle that is a central mask.

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'concentrics';
    super(opts);
    this.border = 0;
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
    const width = this.w();
    const height = this.h();


    // start by making a framing outer circle
    //  this will also be the outer mask
    // then choose the centre point of where the concentric rings should start
    // draw them at varying thicknesses and gaps going outwards until done.

    const mask = new CircleMask({
      translate: { x: 0.5, y: 0.5 },
      radius: 0.4,
      width, height
    });

    this.enqueue(new ApplyGrain({
      alpha: 0.4,
      width, height,
      no: 1200,
      min: 0.003,
      max: 0.006
    }), opts.fgs[1]);

    this.enqueue(new CircleFill({
      alpha: 1.0,
      width, height,
      translate: { x: 0.5, y: 0.5 },
      radius: 0.4
    }), opts.fg[1]);

    for (let i = 0; i < 2; i++) {
      const centre = {
        x: choose([-0.5, -0.37, 0, 0.13, 0.87, 1.37, 1.5]),
        y: choose([-0.5, -0.37, 0, 0.13, 0.87, 1.37, 1.5])
      };

      this.enqueue(new Circles({
        no: 100,
        alpha: rnd_range(0.4, 0.6),
        width, height,
        translate: centre,
        lw_min: 0.01,
        lw_max: 0.04,
        mask,
        t: i
      }), opts.fgs[i+1]);
    }

    /**
    this.enqueue(new ApplyGrain({
      alpha: 0.3,
      width, height,
      no: 1000,
      min: 0.001,
      max: 0.002,
      mask
    }), opts.fg);
    **/

    this.enqueue(new CircleFrame({
      alpha: 1.0,
      width, height,
      translate: { x: 0.5, y: 0.5 },
      radius: 0.4,
      line_width: 0.01,
      t: 0
    }), opts.fg);

    super.execute(opts);
  }
}

