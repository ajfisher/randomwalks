'use strict';

import SimplexNoise from 'simplex-noise';
import bspline from 'b-spline';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';

const TAU = Math.PI * 2;

class CurvePass extends Actionable {
  constructor(options) {
    // take a series of points and then draw a curve across them.
    const opts = options || {};
    super(opts);

    this.pts = opts.points || [];
    this.line_width = opts.line_width || 0.001;
    this.dot_size = opts.dot_size || 0.001;
    this.colours = opts.colours || [];
    this.simplex = opts.simplex;
    this.tightness = opts.tightness || 0.1;
  }

  draw(ctx, colour, ...rest) {
    // draw the line

    const { width, height, pts } = this;

    ctx.save();
    ctx.lineWidth = this.line_width * width;
    // ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    const no_dots = 20;
    const degree = 3;
    const no_knots = pts.length + degree + 1;
    const knots = [];

    for (let k = 0; k < no_knots; k++) {
      if (k < degree + 1) {
        knots.push(0);
      } else if (k >= pts.length - (degree + 1) ) {
        knots.push(2);
      } else {
        knots.push(1);
      }
    }
    const curve_pts = [];

    let no_points = 0; // use this to keep track of how many joints we have

    const interval = 0.0005;
    for (let t = 0; t < 1; t = t + interval) {
      // iterate over the curves together and get the points relevant for
      // each interval set
      curve_pts.push(bspline(t, degree, pts, knots));
      no_points = no_points + 1;
    }
    // add the last point for t=1.0
    curve_pts.push(bspline(1.0, degree, pts, knots));
    no_points = no_points + 1;

    const miny = rnd_range(0.03, 0.05);
    const maxy = rnd_range(0.055, 0.07);
    const gap = rnd_range(0.003, 0.007);
    const rs = 0.3;
    const ps = (1 / no_points) * 0.1;
    const split_pt = rnd_range(0.72, 1.1);

    ctx.globalAlpha = 0.30;
    ctx.strokeStyle = hsvts(colour);
    for (let p = 1; p < no_points; p++) {
      // get the angle made by the line from the last point to the current point
      const xd = (curve_pts[p][0] - curve_pts[p-1][0]);
      const yd = (curve_pts[p][1] - curve_pts[p-1][1]);
      const r = Math.atan2(xd, yd);

      const xd2 = (curve_pts[p-1][0] - curve_pts[p][0]);
      const yd2 = (curve_pts[p-1][1] - curve_pts[p][1]);
      const r2 = Math.atan2(xd2, yd2);

      if (p < split_pt * no_points) {
        ctx.strokeStyle = hsvts(this.colours[2]);
      } else {
        ctx.strokeStyle = hsvts(colour);
      }
      // move to the current point, rotate the canvas and then draw a line
      // perpendicular to the curve
      ctx.save();

      const perc = p / no_points;

      const x = 0; // Math.random() * -(0.5 * Math.abs(xd));
      const y = rnd_range(miny, maxy) * perc; // nrand(0, y_sd);

      // draw one leg
      ctx.save();
      ctx.translate(curve_pts[p][0] * width, curve_pts[p][1] * height);
      // jitter the rotation
      const noiser = this.simplex.noise2D(r * rs, p * ps);
      ctx.rotate(r * noiser);

      ctx.beginPath();
      ctx.moveTo(x * width, gap * perc * height);
      ctx.lineTo(x * width, y * height);
      ctx.stroke();
      ctx.restore();

      // now draw the other
      ctx.save();
      ctx.translate(curve_pts[p][0] * width, curve_pts[p][1] * height);
      // jitter the rotation
      const noiser2 = this.simplex.noise2D(r2 * rs, p * ps);
      ctx.rotate((r2 * noiser2) + (0.5 * TAU));

      ctx.beginPath();
      ctx.moveTo(x * width, gap * perc * height);
      ctx.lineTo(x * width, y * height);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }

    // draw curve
    ctx.lineCaps = 'round';
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = hsvts(this.colours[2]);
    ctx.lineWidth = rnd_range(0.005, 0.015) * width;
    ctx.beginPath();
    for (let p = 1; p < no_points; p++) {
      ctx.moveTo(curve_pts[p-1][0] * width, curve_pts[p-1][1] * height);
      ctx.lineTo(curve_pts[p][0] * width, curve_pts[p][1] * height);
    }
    ctx.stroke();

    /**
    // draw points
    for (let cp = 0; cp < pts.length; cp++) {
      if (cp == 0) {
        ctx.fillStyle = hsvts(this.colours[1]);
      } else {
        ctx.fillStyle = hsvts(this.colours[2]);
      }

      ctx.beginPath();
      const x = pts[cp][0];
      const y = pts[cp][1];
      ctx.moveTo(x * width, y * height);
      ctx.arc(x * width, y * height, 10, 0, TAU);
      ctx.fill();
    }
    **/
    ctx.restore();
  }
}

export default class FuzzyCurve extends Drawable {
  // take a series of points, draw lines between them and then continuously
  // subivide it with a little noise thrown in.

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'fuzzycurve';
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

    const no_points = 8; // rnd_range(4, 15);
    const passes = 1; // rnd_range(20, 30);
    const tightness = rnd_range(0.18, 0.22);
    const points = [];
    // const lw = 0.001;
    const alpha = 0.05;
    const dot_size = 0.001;

    console.log(no_points, passes, tightness);

    // create some initial starting locations.
    for (let p = 0; p < no_points; p++) {
      points.push([
        rnd_range(0.1, 0.9),
        rnd_range(0.1, 0.9)
      ]);
    }

    for (let i = 0; i < passes; i++) {
      this.enqueue(new CurvePass({
        alpha,
        width, height,
        points,
        dot_size,
        simplex: this.simplex,
        colours: opts.fgs,
        tightness,
        t: i
      }), opts.fg);
      // opts.fgs[i % (opts.fgs.length - 1)]);
    }

    super.execute(opts);
  }
}
