'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';
import { CircleFrame } from './primatives/index.js';
import { ApplyGrain } from './concentrics.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';
import { rescale } from './utils/maths.js';

const TAU = Math.PI * 2;
const EMPTY = Symbol('empty');

class Grass extends Actionable {
  // creates a blade of grass
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.simplex = opts.simplex || false;

    this.line_width = opts.line_width || 0.001;
    this.min_amplitude = opts.min_aplitude || 0.001;
    this.max_amplitude = opts.max_amplitude || 0.005;

    this.length = opts.length || 0.1;
    this.radius = opts.radius || 0.4;
    this.theta = rnd_range(-0.15, 0.15) * TAU;

    this.length = rescale(0.15 * TAU, 0, 0.8, 1.8, Math.abs(this.theta)) * this.length;
  }

  draw(ctx, colour, ...rest) {
    // draws the grass

    const {width, height, radius, theta, length, line_width} = this;
    const {min_amplitude, max_amplitude} = this;
    super.draw(ctx);

    ctx.lineWidth = line_width * width;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);
    ctx.globalAlpha = this.alpha;

    /**
    // draw the circle bounds
    ctx.beginPath();
    ctx.arc(0, 0, radius * width, 0, TAU);
    ctx.stroke();
    **/

    // Find the angle you need to draw at
    // go out to the radius point
    const x = Math.cos(theta) * radius;
    const y = Math.sin(theta) * radius;

    ctx.translate(x * width, y * height);
    ctx.rotate(0.5 * Math.PI);
    // ctx.rotate(theta + 0.5 * Math.PI);
    /**
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, TAU);
    ctx.fill();
    **/

    // get the interval and then draw the points along the way to draw it
    const interval = 0.01;

    ctx.beginPath();
    ctx.moveTo(0, 0);

    const min_period = 0.5;
    const max_period = 0.05;
    const line_max_amp = rescale(0, radius, min_amplitude, max_amplitude, length);
    const line_max_period = rescale(0, radius*2.5, min_period, max_period, length);

    const mv = 0.02;
    const s = 0.2;

    let px = 0;
    for (let t = 0; t <= 1.0; t = t + interval) {
      const amplitude = rescale(0, 1.0, min_amplitude, line_max_amp, t);
      const period = rescale(0, 1.0, min_period, line_max_period, t);

      px = Math.sin(t / period * TAU) * amplitude;
      const noisex = this.simplex.noise2D(px * s, t * s);
      // const noisex = 0;
      px = px + (noisex * mv);

      ctx.lineTo(px * width, t * length * height);
    }
    ctx.stroke();

    // draw a dot on the end
    if (Math.random() < 0.45) {
      ctx.beginPath();
      ctx.arc(px * width, 0.99 * length * height, 5, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }
}

export default class LightGrass extends Drawable {
  // draw lines that subdivide

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'linegrass';
    opts.border = 0.00;
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

    const radius = 0.4;
    const line_width = rnd_range(0.0015, 0.003); // Math.ceil((this.w()-border) / no_lines);
    const lines = rnd_range(550, 850);

    const min_amplitude = 0.001;
    const max_amplitude = rnd_range(0.004, 0.006);

    this.simplex = new SimplexNoise();

    console.log(line_width, lines, max_amplitude);

    const position = { x: 0.5, y: 0.4 };

    this.enqueue(new ApplyGrain({
      alpha: 0.5,
      width, height,
      no: rnd_range(200, 400),
      min: 0.002,
      max: 0.004
    }), opts.fgs[1]);

    for (let l = 0; l < lines; l++) {
      // make some lines

      let length = Math.abs(nrand(0.5 * radius, 0.25 * radius));
      if (length > 0.95 * radius) length = 0.95 * radius;

      this.enqueue(new Grass({
        alpha: 0.05 + (l / lines) * 0.5,
        width, height,
        translate: position,
        rotate: 0.25,
        radius,
        length, line_width,
        min_amplitude, max_amplitude,
        simplex: this.simplex,
        t: l
      }), opts.fgs[1 + l % (opts.fgs.length-2)]);
    }

    this.enqueue(new CircleFrame({
      alpha: 0.8,
      width, height,
      line_width: 3 * line_width,
      translate: position,
      radius,
      extent: {start: 0.08, end: 0.42}
    }), opts.fg);

    super.execute(opts);
  }
}
