'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable';

import { Actionable } from './actions';

import { choose, rnd_range, nrand } from './utils/random';
import { hsvts, rank_contrast } from './utils/draw';

const TAU = Math.PI * 2;

class Circle {
  constructor(options) {
    // makes a new circle object
    const opts = options || {};
    this.x = opts.x || 0.0;
    this.y = opts.y || 0.0;
    this.r = opts.r || 0.1;
    this.fill = opts.fill || 0.1; // amount of points to make
    this.dot_size = opts.dot_size || 0.001;
    this.simplex = opts.simplex || false;
    this.scale = opts.scale || 0.5;
    this.start_points = [];
    this.points = [];
    this.pass_perc = opts.pass_perc || 1.0;

    // add the starting points in
    const no_points = Math.floor(this.r * TAU / this.dot_size * this.fill);
    for (let p = 0; p < no_points; p++) {
      const t = p / no_points * TAU;
      const px = Math.cos(t) * this.r;
      const py = Math.sin(t) * this.r;
      this.points.push({x: px, y: py});
    }
  }

  update(t, mv, scale) {
    // this process updates the positions of all the points in the circle

    const s = scale;

    // this.points = [];

    for (let p = 0; p < this.points.length; p++) {
      const pt = this.points[p];

      const xnoise = this.simplex.noise2D(pt.x * s, t * s);
      const ynoise = this.simplex.noise2D(pt.y * s, t * s);

      pt.x = pt.x + (xnoise * mv * this.pass_perc);
      pt.y = pt.y + (ynoise * mv * this.pass_perc);

      this.points[p] = pt;
    }
  }
}

class Pass extends Actionable {
  constructor(options) {
    // take a series of points and then draw a curve across them.
    const opts = options || {};
    super(opts);

    if (typeof(opts.circle) === 'undefined') {
      throw new Error('need a circle');
    }

    this.circle = opts.circle;
    this.dot_size = opts.dot_size || 0.001;
    this.simplex = opts.simplex;
    this.mv = opts.mv || 0.02;
    this.fill = opts.fill || 0.5;
    this.scale = opts.scale || 1.0;
    this.no_dots = opts.no_dots || 10;
  }

  draw(ctx, colour, ...rest) {
    // draw the line

    const { width, height, circle, mv, dot_size, fill, scale: s } = this;
    const { x: cx, y: cy } = this.translate;
    super.draw(ctx);

    ctx.save();
    ctx.lineWidth = this.dot_size * width;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    circle.update(this.t, mv, this.scale)
    /**
    // draw line boundary of the circle as points
    for (let p = 0; p < circle.points.length; p++) {
      const pt = circle.points[p];
      ctx.beginPath();
      ctx.arc(pt.x * width, pt.y * height, dot_size * width, 0, TAU);
      ctx.fill();
    }
    **/
    const no_dots = 10;
    // ctx.beginPath();
    for (let p = 0; p < circle.points.length; p++) {
      const p1 = (p == 0) ? circle.points[circle.points.length - 1] : circle.points[p-1];
      const p2 = circle.points[p];

      // ctx.moveTo(p1.x * width, p1.y * height);
      // ctx.lineTo(p2.x * width, p2.y * height);
      const pdx = p2.x - p1.x;
      const pdy = p2.y - p1.y;

      for (let d = 0; d < no_dots; d++) {
        const dt = d / no_dots;
        const dx = p1.x + (pdx * dt);
        const dy = p1.y + (pdy * dt);

        ctx.beginPath();
        ctx.arc(dx * width, dy * height, dot_size * width, 0, TAU);
        ctx.fill();
      }
    }
    // ctx.stroke();

    ctx.restore();
  }
}

export default class CircleWaves extends Drawable {
  // take a series of circles, turn them into points and then push the points
  // using noise to distort them

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'circlewaves';
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

    const no_circles = rnd_range(1, 5);
    const circles = [];
    const passes = 300; // rnd_range(100, 200);
    const alpha = 0.02;
    const dot_size = 0.001;
    const fill = 0.1; // rnd_range(0.01, 0.01);
    const mv = 0.008; // rnd_range(0.02, 0.07);
    const scale = 1.9; // rnd_range(0.05, 1.9);

    console.log(no_circles, passes, scale);

    // create some initial starting locations for the circles
    for (let c = 0; c < no_circles; c++) {
      circles.push(new Circle({
        x: rnd_range(0.2, 0.8),
        y: rnd_range(0.2, 0.8),
        r: rnd_range(0.1, 0.3),
        fill, scale,
        simplex: this.simplex
      }));
    }

    for (let i = 0; i < passes; i++) {
      // do an iteration of the whole frame

      for (let c = 0; c < no_circles; c++) {
        // add all of the circles to a pass to draw

        this.enqueue(new Pass({
          alpha,
          width, height,
          circle: circles[c],
          translate: circles[c],
          dot_size, fill, mv,
          simplex: this.simplex,
          colours: opts.fgs,
          scale: (i+1) / passes * scale,
          pass_perc: 1, // i / passes,
          t: i
        }), opts.fgs[c % (no_circles-1)]);
      }
    }

    super.execute(opts);
  }
}
