'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';
import { chaikin, convex } from './utils/geometry.js';

const TAU = Math.PI * 2;

class RowPolys extends Actionable {
  constructor(options) {
    // take a series of points and then draw a curve across them.
    const opts = options || {};
    super(opts);

    this.line_width = opts.line_width || 0.001;
    this.dot_size = opts.dot_size || 0.001;
    this.colours = opts.colours || [];
    this.simplex = opts.simplex;
    this.mv = opts.mv || 0.1;
    this.cell_w = opts.cell_w || 0.1;
    this.cell_h = opts.cell_h || 0.1;
    this.cell_pad = opts.cell_pad || 0.05;
    this.cols = opts.cols || 5;
    this.max_points = opts.max_pts || 3;

    const y_upper = (this.cell_pad - 0.65) * this.cell_h;
    const y_lower = (0.65 - this.cell_pad) * this.cell_h;

    // work out where the base points go now
    this.pts = [];
    for (let c = 0; c < this.cols; c++) {
      this.pts.push({
        x: c * this.cell_w + 0.5 * this.cell_w,
        y: rnd_range(y_upper, y_lower)
      });
    }
    // create each of the polygons
    this.polys = [];
    for (let p = 1; p < this.pts.length; p++) {
      // for each pair of points, choose some random points near to it
      // then collectively generate a convex hull and then finally chaikin
      // relax it to get the poly points.
      const p1 = this.pts[p-1];
      const p2 = this.pts[p];
      let polypts = [];
      const cell_w = this.cell_w;

      // add a point to the left of P1 and to the right of p2 just so we
      // get a colour overlap between the polys

      polypts.push({
        x: p1.x - (rnd_range(0.15, 0.75) * this.cell_w),
        y: rnd_range(y_upper, y_lower)
      });
      polypts.push({
        x: p2.x + (rnd_range(0.15, 0.5) * this.cell_w),
        y: rnd_range(y_upper, y_lower)
      });

      [p1, p2].forEach((pt, indx) => {
        const no_points = rnd_range(1, this.max_points);
        const xw = 0.5;

        for (let i = 0; i < no_points; i++) {
          polypts.push({
            x: pt.x + rnd_range(-xw * cell_w, xw * cell_w),
            y: rnd_range(y_upper, y_lower)
          });
        }
      });

      for (let i = 0; i < 3; i++) {
        polypts = chaikin(polypts);
      }

      this.polys[p-1] = polypts;
    }
  }

  draw(ctx, colour, ...rest) {
    // draw the line

    const { width, height, pts, mv, dot_size } = this;

    super.draw(ctx);

    ctx.save();
    ctx.lineWidth = this.line_width * width;
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    for (let poly = 0; poly < this.polys.length; poly++) {
      const polypts = this.polys[poly];
      // draw line boundary of poly

      const c = this.colours[poly % 2];
      ctx.fillStyle = hsvts(c);
      ctx.strokeStyle = hsvts(c);
      ctx.beginPath();
      ctx.moveTo(polypts[0].x * width, polypts[0].y * height);
      for (let p = 1; p < polypts.length; p++) {
        const pt = polypts[p];
        ctx.lineTo(pt.x * width, pt.y * height);
      }
      ctx.closePath();
      ctx.globalAlpha = this.alpha;
      ctx.fill();
      ctx.globalAlpha = this.alpha * 1.1;
      ctx.stroke();
    }

    /**
    ctx.lineWidth = this.line_width * width * 10;
    // draw lines between key points.
    for (let p = 1; p < pts.length; p++) {
      const p1 = pts[p-1];
      const p2 = pts[p];

      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }
    **/

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

export default class PolyLinks extends Drawable {
  // create a set of interlinked poly curves

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'polylinks';
    opts.border = 0.04;
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
    const width = this.w(); // - 2 * border;
    const height = this.h(); // - 2 * border;

    this.simplex = new SimplexNoise();

    const rows = 23; // choose([11, 13, 17, 19, 23, 29]);
    const cols = 23; // choose([11, 13, 17, 19, 23, 29]);

    const cell_w = (1.0 - (2 * this.border)) / cols;
    const cell_h = (1.0 - (2 * this.border)) / rows;
    const cell_pad = 0.2; // rnd_range(0.05, 0.1);

    console.log(rows, cols, cell_w, cell_h);

    const alpha = 0.5;
    const dot_size = 0.001;

    for (let r = 0; r < rows; r++) {
      let clrs = [opts.fgs[0], opts.fgs[rnd_range(1, 3)]];
      if (r % 2 != 0) {
        clrs = [opts.fgs[rnd_range(1, 3)], opts.fgs[0]];
      }

      this.enqueue(new RowPolys({
        alpha: rnd_range(0.4, 0.7),
        width, height,
        translate: {x: this.border, y: r * cell_h + this.border + (0.5 * cell_h)},
        dot_size,
        cell_h, cell_w, cell_pad,
        rows, cols,
        max_points: rnd_range(4, 10),
        simplex: this.simplex,
        colours: clrs,
        t: r
      }), opts.fg);
    }

    super.execute(opts);
  }
}


