'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';

import { choose, rnd_range } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';

const TAU = Math.PI * 2;
class Subdivision {
  constructor(options) {
    // creates a tool for subdividing down a series of points using simplex
    // noise to map between them
    const opts = options || {};

    this._pts = opts.points || [];

    if (typeof(opts.simplex) === 'undefined') {
      throw new Error('Subdivision requires a simplex object');
    }
    this.simplex = opts.simplex;
    this.i = 0;
  }

  update(scale=0.05, mv=0.02) {
    // updates the total set of points, adding a new one between each existing on
    const { simplex, i } = this;

    const s = scale;

    const pts = [this._pts[0]]; // get the first point ready

    for (let p = 1; p < this._pts.length; p++) {
      const last_pt = this._pts[p-1];
      const next_pt = this._pts[p];

      let new_x = (next_pt.x + last_pt.x) / 2;
      let new_y = (next_pt.y + last_pt.y) / 2;

      const noisex = simplex.noise2D(new_x * s, i * s);
      const noisey = simplex.noise2D(new_y * s, i * s);

      new_x = new_x + (noisex * mv);
      new_y = new_y + (noisey * mv);

      pts.push({x: new_x, y: new_y});
      pts.push(next_pt);
    }

    this._pts = pts;
    this.i = this.i + 1;
  }

  get points() {
    return this._pts;
  }
}

class SegmentedLine extends Actionable {
  constructor(options) {
    // take a series of points and then draw a line across them
    const opts = options || {};
    super(opts);

    this.pts = opts.points || [];
    this.line_width = opts.line_width || 0.001;
    this.dot_size = opts.dot_size || 0.05;
  }

  draw(ctx, colour, ...rest) {
    // draw the line

    const { width, height, pts } = this;

    ctx.save();
    ctx.lineWidth = this.line_width * width;
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);

    ctx.beginPath();
    ctx.moveTo(pts[0].x * width, pts[0].y * height);
    for (let p = 1; p < pts.length; p++) {
      // draw all of the points
      ctx.lineTo(pts[p].x * width, pts[p].y * height);
    }
    ctx.stroke();

    ctx.moveTo(pts[0].x * width, pts[0].y * height);
    for (let p = 0; p < pts.length; p++) {
      // draw all of the points
      ctx.beginPath();
      // ctx.moveTo(pts[p].x * width, pts[p].y * height);
      const x = pts[p].x * width;
      const y = pts[p].y * height;
      ctx.arc(x, y, this.dot_size * width, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default class LineSubdivision extends Drawable {
  // take a series of points, draw lines between them and then continuously
  // subivide it with a little noise thrown in.

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'linesubdivision';
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

    const no_points = rnd_range(3, 20);
    const iterations = rnd_range(4, 7);
    const points = [];

    // create some initial starting locations.
    for (let p = 0; p < no_points; p++) {
      points.push({
        x: rnd_range(0.1, 0.9),
        y: rnd_range(0.1, 0.9)
      });
    }

    const sub = new Subdivision({
      points,
      simplex: this.simplex
    });

    let scale = choose([0.5, 0.1, 1.7, 7.3, 19.7]) ;
    let move = rnd_range(0.05, 0.15);
    let lw = rnd_range(0.01, 0.02);
    let dot_size = rnd_range(0.03, 0.06);
    let alpha = rnd_range(0.1, 0.2);

    console.log(no_points, iterations, scale, move, lw, dot_size, alpha);

    for (let i = 0; i < iterations; i++) {
      this.enqueue(new SegmentedLine({
        alpha,
        width, height,
        points: sub.points,
        line_width: lw,
        dot_size,
        t: i
      }), opts.fgs[i % (opts.fgs.length - 1)]);

      // console.log(scale, move, lw, dot_size, alpha);

      sub.update(scale, move);
      scale = scale / rnd_range(1.5, 2.1);
      move = move * rnd_range(0.5, 0.75);
      lw = lw * 0.67;
      dot_size = dot_size * rnd_range(0.5, 0.75);
      alpha = alpha * rnd_range(1.1, 1.5);
    }

    super.execute(opts);
  }
}


