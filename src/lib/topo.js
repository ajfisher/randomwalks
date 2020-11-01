'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';

import { ApplyGrain } from './concentrics.js';
import { CircleMask } from './masks/index.js';
import { CircleFrame } from './primatives/index.js';

import { choose, rnd_range } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';

const TAU = Math.PI * 2;

class Contour extends Actionable {
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.no_points = opts.no_points || 100;
    this.x_width = opts.x_width || 0.8 / this.no_points;
    this.colours = opts.colours || [];

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
    const { height, width, no_points} = this;

    if (this.mask) {
      this.mask.clip(ctx);
    }

    const xt = this.translate.x * this.width;
    const yt = this.translate.y * this.height;

    ctx.save();
    ctx.translate(xt, yt);
    ctx.rotate(this.rotate);
    ctx.globalAlpha = this.alpha;

    ctx.lineWidth = 0.004 * this.width;

    const sx = -0.45;
    const sy = -0.1;
    const mv = 0.02;
    const zmv = 0.02;
    const maxz = 20;

    const s = this.scale;

    for (let z = 0; z < maxz; z++) {
      let y = sy;
      let x = sx;

      const ox = -(z * zmv);
      const oy = (z * zmv)

      const c = this.colours[choose([1, 2, 3])];  // this.colours[(z % 3) + 1];
      // lighten the fill
      const fs = c[1];
      let fv = c[2] * rnd_range(0.8, 1.2);
      if (fv > 100) fv = 99.0;

      ctx.fillStyle = hsvts([c[0], fs, fv]);
      // darken the stroke outline
      ctx.strokeStyle = hsvts([c[0], c[1], c[2] * 0.7]);

      ctx.beginPath();
      ctx.moveTo(x * width, y * height);

      // we should now be at the point where we can start drawing.
      for (let p = 0; p < no_points; p++) {
        // move along the x axis by line width at a time and then plot the new
        // line.
        const noise = this.simplex.noise3D(x * s, y * s, z / 10 * s);
        y = y + (noise * mv);
        x = x + this.x_width;
        ctx.lineTo((x) * width, (y+oy) * height);
      }

      ctx.lineTo(0.6 * width, 0.6 * height);
      ctx.lineTo(-0.6 * width, 0.6 * height);
      ctx.globalAlpha = this.alpha;
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}

export default class Topography extends Drawable {
  // creates a faux contour map using simplex noise to drive it in a
  // isometric projection.

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'topography';
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

    const centre = { x: 0.5, y: 0.5 };
    const radius = 0.4;
    const no_points = 100;
    const x_width = 2 * (1.1*radius) / no_points;
    const scale = rnd_range(0.1, 1.1);

    console.log(scale);

    const mask = new CircleMask({
      translate: centre,
      radius,
      width, height
    });

    this.enqueue(new ApplyGrain({
      alpha: 0.45,
      width, height,
      mask,
      no: rnd_range(500, 1500),
      min: 0.002,
      max: 0.004
    }), opts.fgs[1]);

    this.enqueue(new Contour({
      alpha: 1,
      width, height,
      no_points,
      x_width,
      translate: { x: 0.5, y:0.5 },
      rotate: rnd_range(-0.05, 0.05) * TAU,
      mask,
      simplex: this.simplex,
      scale,
      colours: opts.fgs,
      t: 0
    }), opts.fgs[1]);

    this.enqueue(new CircleFrame({
      alpha: 1,
      width, height,
      translate: centre,
      radius,
      line_width: 0.01,
      t: 0
    }), opts.fg);

    super.execute(opts);
  }
}


