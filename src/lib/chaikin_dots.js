'use strict';

import _ from 'lodash';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';

const TAU = Math.PI * 2;

class Pass extends Actionable {
  constructor(options) {
    // take a series of points and then draw a curve across them.
    const opts = options || {};
    super(opts);

    this.pts = opts.points || [];
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

    const { width, height, pts, mv, dot_size } = this;

    ctx.save();
    ctx.lineWidth = this.line_width * width;
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    /**
    // draw line boundary of poly
    ctx.beginPath();
    ctx.moveTo(pts[0].x * width, pts[0].y * height);
    for (let p = 1; p < pts.length; p++) {
      const pt = pts[p];
      ctx.lineTo(pt.x * width, pt.y * height);
    }
    ctx.closePath();
    ctx.stroke();
    **/

    // iterate over each line segment then create sandlines off them

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
      /**
      if (p < 1 && this.t < 0.2 && this.t > 0.18) {
        console.log(p1.x, p1.y, this.t);
      }
      **/
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

    /**
    // draw points
    ctx.globalAlpha = 0.5 * this.alpha;
    for (let p = 0; p < pts.length; p++) {
      const pt = pts[p];

      ctx.beginPath();
      ctx.moveTo(pt.x * width, pt.y * height);
      ctx.arc(pt.x * width, pt.y * height, 10, 0, TAU);
      ctx.fill();
    }
    **/

    ctx.restore();
  }
}

export default class ChaikinPolyDots extends Drawable {
  // take a series of points and turn them into a convex poly and then relax
  // the path be using Chaikin Curve

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'chaikinpoly';
    opts.border = 0.0;
    super(opts);
  }

  chaikin(points) {
    // takes the set of polygon points and then uses the chaikin curve algoritm to
    // put in additional subdivisions to try and relax it into a curve.

    const new_points = [];
    for (let p = 0; p < points.length; p++) {
      // for the special case where p == 0, need to get the last point
      let p1;
      if (p == 0) {
        p1 = points[points.length - 1];
      } else {
        p1 = points[p-1];
      }

      const p2 = points[p];

      const q = {
        x: p1.x + 0.25 * (p2.x - p1.x),
        y: p1.y + 0.25 * (p2.y - p1.y)
      };

      const r = {
        x: p1.x + 0.75 * (p2.x - p1.x),
        y: p1.y + 0.75 * (p2.y - p1.y)
      };

      new_points.push(q);
      new_points.push(r);
    }

    return new_points;
  }

  convex(points) {
    // take a list of points and then convert them to a convex hull
    // use similar to Graham's Algorithm but we know that the points are
    // the outer points anyway so don't need to contain any

    // find the left and rightmost items
    const xsorted = _.sortBy(points, ['x']);
    const minpt = xsorted[0];
    const maxpt = xsorted[xsorted.length-1];
    // now iterate across the x positions and then add the points to the top
    // and bottom hulls
    const toppts = [];
    let bottompts = [];

    for (let i = 1; i < xsorted.length; i++) {
      const curr_pt = xsorted[i];
      if (curr_pt.y < minpt.y) {
        // check to see if we have a major dip problem
        if (toppts.length >= 2) {
          const lst_pt = toppts[toppts.length-1];
          const sndlst_pt = toppts[toppts.length-2];
          if (lst_pt.y > curr_pt.y && sndlst_pt.y < lst_pt.y) {
            // we have a big dip so push that point to the bottom points instead
            bottompts.push(toppts.pop());
          }
        }
        toppts.push(curr_pt);
      } else {
        bottompts.push(curr_pt);
      }
    }
    bottompts = _.reverse(bottompts);

    // reconstruct the array in order
    return [minpt, ...toppts, ...bottompts];
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
    const passes = rnd_range(100, 300);
    const points = [];
    const alpha = 0.04;
    const dot_size = 0.001;
    const fill = rnd_range(0.5, 0.8);
    const mv = 0.001; // rnd_range(0.001, 0.005);
    const no_polys = rnd_range(1, 6);
    const scale = rnd_range(0.55, 0.8);

    console.log(no_points, passes, scale, fill, no_polys);

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
      points[poly] = this.convex(points[poly]);

      // relax the control polygon using Chaikin Curve algorithm
      for (let c = 0; c < no_relaxations; c++) {
        points[poly] = this.chaikin(points[poly]);
      }
    }

    for (let i = 0; i < passes; i++) {
      // do an iteration.

      for (let poly = 0; poly < no_polys; poly++) {
        const c = opts.fgs[poly % no_polys];

        this.enqueue(new Pass({
          alpha,
          width, height,
          points: points[poly],
          dot_size,
          fill,
          mv,
          simplex: this.simplex,
          colours: opts.fgs,
          scale,
          t: (i+1) / passes * (poly+1)
        }), c);
      }
      // }), opts.fg);
      // }), opts.fgs[i % (opts.fgs.length - 1)]);
    }

    super.execute(opts);
  }
}

