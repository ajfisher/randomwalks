'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable';

import { Actionable } from './actions';

import { choose, rnd_range, nrand } from './utils/random';
import { hsvts, rank_contrast } from './utils/draw';
import { circle_intersections } from './utils/geometry';

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
    this.i_dot_size = opts.i_dot_size || 20 * this.dot_size;
    this.simplex = opts.simplex;
    this.mv = opts.mv || 0.02;
    this.fill = opts.fill || 0.5;
    this.scale = opts.scale || 1.0;
    this.no_dots = opts.no_dots || 10;
    this.colours = opts.colours || [];
  }

  draw(ctx, colour, ...rest) {
    // draw the line

    const { width, height, circle, mv, dot_size, fill, scale: s, no_dots } = this;
    const { x: cx, y: cy } = this.translate;
    super.draw(ctx);

    ctx.save();
    ctx.globalAlpha = 1.5 * this.alpha;
    ctx.lineWidth = this.dot_size * width;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    /**
    // draw line boundary of the circle
    ctx.beginPath();
    ctx.arc(0, 0, circle.r * width, 0, TAU);
    ctx.stroke();
    **/

    const border_dots = no_dots * circle.r;
    const ds = this.i_dot_size * circle.r; // smaller circle means smaller dots

    ctx.save();
    ctx.globalAlpha = 0.3 * this.alpha;

    // draw the points of intersection of this circle
    for (let i = 0; i < circle.ix.length; i++) {
      const pt = circle.ix[i];
      const c = this.colours[i % (this.colours.length - 1)];

      let {x, y}  = pt;

      // jitter the x,y near to the point we want to focus on.
      const xnoise = this.simplex.noise2D(x * s, this.t * s);
      const ynoise = this.simplex.noise2D(y * s, this.t * s);

      x = x + (xnoise * mv);
      y = y + (ynoise * mv);

      ctx.shadowColor = hsvts([c[0], 90.0, c[2]]);
      ctx.shadowBlur = ds * 1.5;

      ctx.fillStyle = hsvts(c);
      ctx.beginPath();
      ctx.arc(x * width, y * height, ds * width, 0, TAU);
      ctx.fill();
      // }
    }
    ctx.restore();

    const r = circle.r;
    // get random points on the perimeter of the circle and plot them in.
    for (let p = 0; p < border_dots; p++) {
      // jump to a new point.
      const t = Math.random();

      const x = Math.cos(t * TAU) * r;
      const y = Math.sin(t * TAU) * r;

      ctx.beginPath();
      ctx.arc(x * width, y * height, dot_size * width, 0, TAU);
      ctx.fill();
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

    const no_circles = rnd_range(10, 30);
    const circles = [];
    const passes = rnd_range(50, 75);
    const alpha = 0.02; // 0.09;
    const dot_size = 0.001;
    const i_dot_size = 30 * dot_size;
    const fill = rnd_range(0.01, 0.01);
    const mv = rnd_range(0.010, 0.020);
    const scale = rnd_range(10, 100);
    const no_dots = rnd_range(60, 100);

    console.log(no_circles, passes, scale, mv, no_dots);

    // create some initial starting locations.
    for (let c = 0; c < no_circles; c++) {
      circles.push({
        x: rnd_range(0.1, 0.9),
        y: rnd_range(0.1, 0.9),
        r: rnd_range(0.05, 0.4),
        ix: []
      });
    }

    // now we have all of the circles, work out the various intersection points
    // and store them relative to the centre of the circle.
    for (let c1 = 0; c1 < circles.length; c1++) {
      for (let c2 = 0; c2 < circles.length; c2++) {
        if (c1 != c2) {
          let ix = circle_intersections(circles[c1], circles[c2]);
          ix = ix.map((pt) => {
            return {
              x: pt.x - circles[c1].x,
              y: pt.y - circles[c1].y
            };
          });
          if (ix.length != 0) {
            circles[c1].ix = [...circles[c1].ix, ...ix];
          }
        }
      }
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
          dot_size, mv,
          i_dot_size: (1.0 - (i / passes)) * i_dot_size,
          simplex: this.simplex,
          scale, no_dots,
          colours: opts.fgs,
          t: (i+1) * (c+1) * scale
        }), opts.fg);
        // }), opts.fgs[c % 3]);
      }
    }

    super.execute(opts);
  }
}
