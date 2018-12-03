'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable';

import { Actionable } from './actions';

import { choose, rnd_range, nrand } from './utils/random';
import { hsvts, rank_contrast } from './utils/draw';

const TAU = Math.PI * 2;

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

    const { width, height, circle, mv, dot_size, fill, scale: s, no_dots } = this;
    const { x: cx, y: cy } = this.translate;
    super.draw(ctx);

    ctx.save();
    ctx.lineWidth = this.dot_size * width;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    /**
    // draw line boundary of the circle
    ctx.beginPath();
    ctx.arc(0, 0, circle.r * width, 0, TAU);
    ctx.stroke();
    **/

    // jitter the radius.
    const rnoise = this.simplex.noise2D(circle.r, this.t * s);
    const r = circle.r + (rnoise * this.mv);
    // const r = circle.r;

    // account for changing sizes of circles.
    const circum = TAU * r;

    // get random points on the perimeter of the circle and plot them in.
    for (let p = 0; p < circle.focii.length; p++) {
      // jump to a new point.
      // if (Math.random() < fill / 10) {
      const t = circle.focii[p];
      // }

      for (let d = 0; d < no_dots; d++) {
        // get the starting point
        let x = Math.cos(t * TAU) * r;
        let y = Math.sin(t * TAU) * r;

        // now jitter the x,y near to the point we want to focus on.
        const xnoise = this.simplex.noise2D(x * s, this.t * s);
        const ynoise = this.simplex.noise2D(y * s, this.t * s);

        x = x + (xnoise * mv);
        y = y + (ynoise * mv);

        ctx.beginPath();
        ctx.arc(x * width, y * height, dot_size * width, 0, TAU);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

export default class Intersections extends Drawable {
  // take a series of points and turn them into a convex poly and then relax
  // the path be using Chaikin Curve

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'intersections';
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

    const no_circles = rnd_range(3, 8);
    const circles = [];
    const passes = rnd_range(100, 200);
    const alpha = 0.09;
    const dot_size = 0.001;
    const fill = rnd_range(0.01, 0.01);
    const mv = 0.03; // rnd_range(0.02, 0.07);
    const scale = rnd_range(0.035, 0.05);
    const no_dots = 1;

    console.log(no_circles, passes, scale);

    // create some initial starting locations.
    for (let c = 0; c < no_circles; c++) {
      const no_focii = rnd_range(30, 150);
      const focii = [];

      for (let p = 0; p < no_focii; p++) {
        focii.push(Math.random());
      }

      circles.push({
        x: rnd_range(0.4, 0.6),
        y: rnd_range(0.4, 0.6),
        r: rnd_range(0.05, 0.33),
        focii
      });
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
          scale, no_dots,
          t: (i+1) * (c+1) * scale
        }), opts.fgs[c % (no_circles-1)]);
      }
    }

    super.execute(opts);
  }
}


