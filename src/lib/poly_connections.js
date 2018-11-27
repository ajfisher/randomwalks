'use strict';

import _ from 'lodash';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable';

import { Actionable } from './actions';

import { rescale } from './utils/maths';
import { choose, rnd_range, nrand } from './utils/random';
import { hsvts, rank_contrast } from './utils/draw';
import { chaikin, convex } from './utils/geometry';

const TAU = Math.PI * 2;

class Pass extends Actionable {
  constructor(options) {
    // take a series of points and then draw a curve across them.
    const opts = options || {};
    super(opts);

    this.polys = opts.polys || [[], []];
    this.line_width = opts.line_width || 0.001;
    this.dot_size = opts.dot_size || 0.001;
    this.colours = opts.colours || [];
    this.simplex = opts.simplex;
    this.mv = opts.mv || 0.02;
    this.fill = opts.fill || 0.5;
    this.scale = opts.scale || 1.0;
  }

  draw(ctx, colour, ...rest) {
    // draw the line

    const { width, height, polys, mv, dot_size } = this;

    ctx.save();
    ctx.lineWidth = this.line_width * width;
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    // go from each point and draw a line between the same segments
    const no_points = polys[0].length;
    const fg_poly = polys[0];
    const bg_poly = polys[1];

    const depth = 10; // faux distance into the bg the object is.

    for (let p = 0; p < no_points; p++) {
      // get the points between the polys and then draw a line between them
      const fg_pt = fg_poly[p];
      const bg_pt = bg_poly[p];

      const pdx = fg_pt.x - bg_pt.x;
      const pdy = fg_pt.y - bg_pt.y;

      const p1p2_dist = Math.sqrt(pdx * pdx + pdy * pdy);
      const no_dots = p1p2_dist / dot_size * this.fill;
      // choose a bunch of random dots over the segment
      for (let d = 0; d < no_dots; d++) {
        const t = Math.random();
        let dx = fg_pt.x + t * pdx;
        let dy = fg_pt.y + t * pdy;

        const ds = dot_size * (1 - t);
        const s = rescale(0.0, 1.0, 0.01, this.scale, t);

        // jitter the dot
        const dx_noise = this.simplex.noise2D(dx * s, this.t * s);
        const dy_noise = this.simplex.noise2D(dy * s, this.t * s);

        dx = dx + (dx_noise * this.mv);
        dy = dy + (dy_noise * this.mv);

        ctx.beginPath();
        ctx.moveTo(dx * width, dy * height);
        ctx.arc(dx * width, dy * height, ds * width, 0, TAU);
        ctx.fill();
      }
    }
    // iterate over each line segment then create sandlines off them

    /**
    const s = this.scale;

    for (let p = 0; p < pts.length; p++) {
      // deal with first line segment by getting the last one.
      const p1 = (p == 0) ? pts[pts.length-1] : pts[p-1];
      const p2 = pts[p];

      const p1x_noise = this.simplex.noise2D(p1.x * s, this.t * s);
      const p1y_noise = this.simplex.noise2D(p1.y * s, this.t * s);
      const p2x_noise = this.simplex.noise2D(p2.x * s, this.t * s);
      const p2y_noise = this.simplex.noise2D(p2.y * s, this.t * s);

      p1.x = p1.x + (p1x_noise * this.mv);
      p1.y = p1.y + (p1y_noise * this.mv);

      p2.x = p2.x + (p2x_noise * this.mv);
      p2.y = p2.y + (p2y_noise * this.mv);

      const pdx = p2.x - p1.x;
      const pdy = p2.y - p1.y;

      const p1p2_dist = Math.sqrt(pdx * pdx + pdy * pdy);
      const no_dots = p1p2_dist / this.dot_size * this.fill;
      // choose a bunch of random dots over the segment
      for (let d = 0; d < no_dots; d++) {
        const t = Math.random();
        const dx = p1.x + t * pdx;
        const dy = p1.y + t * pdy;

        ctx.beginPath();
        ctx.moveTo(dx * width, dy * height);
        ctx.arc(dx * width, dy * height, this.dot_size * width, 0, TAU);
        ctx.fill();
      }
    }
    **/

    /**
    for (let poly = 0; poly < polys.length; poly++) {
      const pts = polys[poly];
      // draw line boundary of poly
      ctx.beginPath();
      ctx.moveTo(pts[0].x * width, pts[0].y * height);
      for (let p = 1; p < pts.length; p++) {
        const pt = pts[p];
        ctx.lineTo(pt.x * width, pt.y * height);
      }
      ctx.closePath();
      ctx.stroke();

      // draw points
      ctx.globalAlpha = 0.5 * this.alpha;
      for (let p = 0; p < pts.length; p++) {
        const pt = pts[p];

        ctx.beginPath();
        ctx.moveTo(pt.x * width, pt.y * height);
        ctx.arc(pt.x * width, pt.y * height, 10, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = this.alpha;
    }
    **/


    ctx.restore();
  }
}

export default class PolyConnection extends Drawable {
  // take a series of points and turn them into a convex poly and then relax
  // the path be using Chaikin Curve

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'chaikinpoly';
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

    const no_points = rnd_range(4, 12);
    const no_relaxations = 4;
    const passes = rnd_range(200, 400);
    const points = [];
    const alpha = 0.04;
    const dot_size = 0.001;
    const fill = rnd_range(0.1, 0.3);
    const mv = rnd_range(0.015, 0.020);
    const no_polys = 2;
    const scale = rnd_range(0.5, 2.5);

    console.log(passes, scale, fill, mv);

    // create some initial starting locations.
    for (let poly = 0; poly < no_polys; poly++) {
      points[poly] = [];
      for (let p = 0; p < no_points; p++) {
        points[poly].push({
          x: rnd_range(0.2, 0.8),
          y: rnd_range(0.2, 0.8)
        });
      }
      // now order the points into a convex hull
      points[poly] = convex(points[poly]);

      // relax the control polygon using Chaikin Curve algorithm
      for (let c = 0; c < no_relaxations; c++) {
        points[poly] = chaikin(points[poly]);
      }
    }

    for (let i = 0; i < passes; i++) {
      // do an iteration.

      const c = opts.fgs[0];

      this.enqueue(new Pass({
        alpha,
        width, height,
        polys: points,
        dot_size,
        fill,
        mv,
        simplex: this.simplex,
        colours: opts.fgs,
        scale,
        t: (i+1) / passes
      }), c);
      // }), opts.fg);
      // }), opts.fgs[i % (opts.fgs.length - 1)]);
    }

    super.execute(opts);
  }
}

