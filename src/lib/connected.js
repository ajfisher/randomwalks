'use strict';

import SimplexNoise from 'simplex-noise';
import bspline from 'b-spline';

import Drawable from './drawable';

import { Actionable } from './actions';

import { choose, rnd_range, nrand } from './utils/random';
import { hsvts, rank_contrast } from './utils/draw';

const TAU = Math.PI * 2;

class ConnectedPass extends Actionable {
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
    // draw the lines

    const { width, height, pts } = this;

    ctx.save();
    ctx.lineWidth = this.line_width * width;
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    const no_dots = 20;
    const degree = 3;
    const s_pts = [];
    const last_pts = [];
    const curve_pts = [];
    for (let c = 0; c < pts.length; c++) {
      s_pts.push(bspline(0, degree, pts[c]));
      last_pts[c] = s_pts[c];
      curve_pts[c] = [s_pts[c]];
    }

    const interval = 0.0005;
    const y_sd = this.tightness;
    let no_points = 1; // use this to keep track of how many joints we have

    for (let t = interval; t < 1.0; t = t + interval) {
      // iterate over the curves together and get the points relevant for
      // each interval set
      const curr_pts = [];
      for (let c = 0; c < pts.length; c++) {
        curr_pts[c] = bspline(t, degree, pts[c]);
        curve_pts[c].push(curr_pts[c]);
        last_pts[c] = curr_pts[c];
      }
      no_points = no_points + 1;
    }

    // draw each curve
    ctx.globalAlpha = 0.5 * this.alpha;
    for (let c = 0; c < pts.length; c++) {
      ctx.beginPath();
      ctx.moveTo(curve_pts[c][0][0] * width, curve_pts[c][0][1] * height);
      for (let p = 1; p < curve_pts[c].length; p++) {
        // ctx.moveTo(curve_pts[c][p-1][0] * width, curve_pts[c][p-1][1] * height);
        ctx.lineTo(curve_pts[c][p][0] * width, curve_pts[c][p][1] * height);
      }
      ctx.stroke();
    }

    // draw connecting lines
    // TODO turn this into sandlines between the points
    ctx.lineWidth = this.dot_size * width;
    ctx.globalAlpha = this.alpha;
    for (let j = 0; j < no_points; j++) {
      ctx.beginPath();
      ctx.moveTo(curve_pts[0][j][0] * width, curve_pts[0][j][1] * height);
      for (let c = 1; c < curve_pts.length; c++) {
        ctx.lineTo(curve_pts[c][j][0] * width, curve_pts[c][j][1] * height);
      }
      ctx.stroke();
    }

    /**
    ctx.globalAlpha = 1.0;
    for (let j = 0; j < no_points; j++) {
      // get the angle made by the line from the last point to the current point
      const xd = (curve_pts[1][j][0] - curve_pts[0][j][0]);
      const yd = (curve_pts[1][j][1] - curve_pts[0][j][1]);
      // const r = Math.atan2(xd, yd);

      // move to the current point, rotate the canvas and then draw a line
      // from the first curve to the second
      ctx.save();
      ctx.translate(curve_pts[0][j][0] * width, curve_pts[0][j][1] * height);
      // jitter the rotation
      // const noiser = this.simplex.noise2D(r, j);
      // ctx.rotate(r);

      ctx.beginPath();
      for (let d = 0; d < no_dots; d++) {
        // use nrand to plot a bunch of dots
        const p = (d/no_dots);
        const x = p * xd; // Math.random() * -(Math.abs(xd));
        const y = p * yd; // nrand(0, yd);
        const noisex = this.simplex.noise2D(x, d);
        const noisey = this.simplex.noise2D(y, d);

        const c = this.colours[2];

        // choose colour
        let c = this.colours[0];
        if (y < y_sd ) {
          c = this.colours[1];
        } if (y > y_sd) {
          c = this.colours[2];
        }


        const ds = this.dot_size * width;
        ctx.moveTo(x * width, y * height);
        ctx.fillStyle = hsvts(c);
        ctx.arc(x * width, y* height, ds, 0, TAU);
      }
      ctx.fill();

        ctx.restore();
      }
     **/

    ctx.restore();
  }
}

export default class Connected extends Drawable {
  // take a series of points and create two bezier spline curves through them
  // from there, connect the specific points between the t points on each
  // curve as sandlines.

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'curves';
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

    const no_points = rnd_range(4, 15);
    const no_curves = rnd_range(2, 4);
    const passes =  1; // rnd_range(20, 30);
    const curve_pts = [];

    const line_width = 0.001;
    const alpha = 0.15;
    const dot_size = 0.001;

    console.log(no_points, no_curves);

    // create some initial starting locations.
    for (let c = 0; c < no_curves; c++) {
      curve_pts[c] = [];
      for (let p = 0; p < no_points; p++) {
        curve_pts[c].push([
          rnd_range(0.1, 0.9),
          rnd_range(0.1, 0.9)
        ]);
      }
    }

    for (let i = 0; i < passes; i++) {
      this.enqueue(new ConnectedPass({
        alpha,
        width, height,
        points: curve_pts,
        dot_size,
        line_width,
        simplex: this.simplex,
        colours: opts.fgs,
        t: i
      }), opts.fg);
      // opts.fgs[i % (opts.fgs.length - 1)]);
    }

    super.execute(opts);
  }
}
