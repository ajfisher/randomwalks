'use strict';

import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable.js';
import Drawable from './drawable.js';

import { BlockMask } from './masks/index.js';

import { SimplexFill } from './fills/index.js';

import { choose, hsvts, rank_contrast, nrand } from './utils.js';
import { rescale, rnd_range } from './utils.js';

const TAU = Math.PI * 2;

class Ring extends Actionable {
  // draws a lamp
  constructor(options) {
    // build the light source
    const opts = options || {};
    super(opts);

    this.radius = opts.radius || 0.4;

    this.simplex = opts.simplex;
    this.scale = opts.scale || 0.1;
    this.line_scale = opts.line_scale || this.scale;
    this.use_tx = true;
  }

  draw(ctx, colour, ...rest) {
    const {width, height, radius, scale, line_scale } = this;

    // we use these contexts to assist with fills
    if (this.use_tx) {
      this.tx_ctx = rest[0] || false;
      this.pd_ctx = rest[1] || false;
    }

    const {tx_ctx, pd_ctx} = this;

    // create and set up the fill
    const sf = new SimplexFill({
      width, height,
      alpha: this.alpha,
      scale,
      steps: 128,
      simplex: this.simplex
    });
    tx_ctx.clearRect(0,0, width, height); // kill the texture map
    sf.fill(tx_ctx);

    // now we draw the ring on the predraw plate
    pd_ctx.clearRect(0,0, width, height);

    pd_ctx.save();
    super.draw(pd_ctx);

    pd_ctx.strokeStyle = hsvts(colour);
    pd_ctx.fillStyle = hsvts(colour);
    pd_ctx.globalAlpha = 1.0;
    pd_ctx.beginPath();

    const lines = rnd_range(4000, 8000) * this.radius;
    for (let l = 0; l < lines; l++) {
      // choose random points around the circle and then basically
      // just draw lines.
      //
      // get the angles for position of the line, the angle of the line
      // and then length of the line
      const theta = Math.random() * TAU; // radians randomly about circle
      const l_theta = Math.random() * TAU;
      const line_length = rnd_range(0.001, 0.04);

      // SOH CAH TOA
      const x0 = radius * Math.cos(theta);
      const y0 = radius * Math.sin(theta);

      const s = 1;

      const xn = this.simplex.noise2D(x0 * s, l/lines * s);
      const x1 = x0 + xn * line_length;
      const yn = this.simplex.noise2D(y0 * s, l/lines * s);
      const y1 = y0 + yn * line_length;
      if (l ==0) {
        // console.log(scale, xn, x1, yn, y1);
      }

      const x2 = x1 + Math.cos(l_theta) * line_length * rnd_range(0.1, 1.1)
      const y2 = y1 + Math.sin(l_theta) * line_length * rnd_range(0.1, 1.1);

      // now we have the points, draw a line
      pd_ctx.lineWidth = rnd_range(0.0001, 0.0005) * width;
      pd_ctx.moveTo(x1 * width, y1 * height);
      pd_ctx.lineTo(x2 * width, y2 * height);
      pd_ctx.stroke();
      if (l % 4 == 0) {
        pd_ctx.moveTo(x0 * width, y0 * height);
        const dot_size = rnd_range(0.002, 0.006);
        pd_ctx.arc(x0 * width, y0 * height, dot_size * width, 0, TAU);
        pd_ctx.fill();
      }
    }

    pd_ctx.restore();

    pd_ctx.save();
    pd_ctx.globalCompositeOperation = 'destination-out';
    pd_ctx.drawImage(this.tx_ctx.canvas, 0, 0);
    pd_ctx.restore();

    // now draw the ring back to the main canvas
    ctx.globalAlpha = this.alpha;
    ctx.drawImage(this.pd_ctx.canvas, 0, 0);
  }
}

export default class Rings extends Drawable {
  // draws a ring made of up of noise distorted lines.
  constructor(options) {
    // build a new masked dots.

    const opts = options || {};
    opts.name = 'rings';
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
    const { pd_ctx, tx_ctx } = this;
    this.simplex = new SimplexNoise();

    const no_rings = rnd_range(1, 10);
    for (let r = 0; r < no_rings; r++) {
      // make a bunch of rings

      const centre = {
        x: rnd_range(0.2, 0.8), // choose([0.37, 0.5, 0.67]),
        y: rnd_range(0.2, 0.8) // choose([0.67, 0.67])
      };

      const radius = rnd_range(0.01, 0.3);
      this.enqueue(new Ring({
        alpha: rnd_range(0.7, 0.9),
        width, height,
        translate: centre,
        radius,
        simplex: this.simplex,
        scale: 0.007, // rnd_range(1.5, 7.5),
        t: r
      }), choose(opts.fgs), tx_ctx, pd_ctx);
    }

    super.execute(opts);
  }
}

