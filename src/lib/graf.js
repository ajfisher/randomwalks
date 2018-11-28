'use strict';

import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable';
import Drawable from './drawable';

import { SimplexFill } from './fills';

import { choose, hsvts, rank_contrast, nrand } from './utils';
import { rescale, rnd_range } from './utils';

const TAU = Math.PI * 2;

class Decal extends Actionable {
  // draws a decal on the screen
  constructor(options) {
    // build the decal
    const opts = options || {};
    super(opts);

    this.line_width = opts.line_width || 0.001;
    this.dot_size = opts.dot_size || 0.001;
    this.fill = opts.fill || 0.1;
    this.no_items = opts.no_items || 1;
    this.max_radius = opts.max_radius || 0.1;
    this.simplex = opts.simplex || false;
    this.scale = opts.scale || 0.1;
    this.colours = opts.colours || [];
  }

  circle(ctx, colour, radius, lw) {
    // draws a circle
    const {width, height, dot_size } = this;

    let r = radius;

    const passes = lw / dot_size;
    const mv = dot_size;

    for (let p = 0; p < passes; p++) {
      // do a pass on the circle
      const c = TAU * r;
      const no_dots = c / dot_size / 2 * this.fill;

      // draw the bunch of dots.
      for (let d = 0; d < no_dots; d++) {
        const theta = Math.random() * TAU;
        // SOH CAH TOA
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;

        ctx.beginPath();
        ctx.moveTo(x * width, y * height);
        ctx.arc(x * width, y * height, dot_size * width, 0, TAU);
        ctx.fill();
      }
      r = r + mv;
    }
  }

  cross(ctx, colour, radius, lw) {
    // draws a cross

    this.line(ctx, colour, radius, lw);

    ctx.save();
    ctx.rotate(Math.random() * 0.75 * TAU);
    this.line(ctx, colour, radius, lw);
    ctx.restore();
  }

  line(ctx, colour, radius, lw) {
    // draws a line
    const {width, height, dot_size } = this;

    const r = radius;
    const pts = [];
    // create two endpoints
    for (let v = 0; v < 2; v++) {
      const theta = Math.random()  * TAU;
      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;
      pts.push({x, y});
    }

    const passes = lw / dot_size;
    const mv = dot_size;

    for (let p = 0; p < passes; p++) {
      // do a pass on the circle

      for (let v = 0; v < pts.length; v++) {
        // go through all of the vertices
        const p1 = (v == 0) ? pts[pts.length-1] : pts[v-1];
        const p2 = pts[v];

        const pdx = p2.x - p1.x;
        const pdy = p2.y - p1.y;

        const p1p2_dist = Math.sqrt(pdx * pdx + pdy * pdy);
        const no_dots = p1p2_dist / dot_size * this.fill;

        // draw the bunch of dots.
        for (let d = 0; d < no_dots; d++) {
          const t = Math.random();
          const dx = p1.x + t * pdx;
          const dy = p1.y + t * pdy;

          const ds = dot_size;

          ctx.beginPath();
          ctx.moveTo(dx * width, dy * height);
          ctx.arc(dx * width, dy * height, ds * width, 0, TAU);
          ctx.fill();
        }
      }

      for (let v = 0; v < pts.length; v++) {
        pts[v].x = pts[v].x + mv;
        pts[v].y = pts[v].y + mv;
      }
    }
  }

  triangle(ctx, colour, radius, lw) {
    // draws a triangle
    const {width, height, dot_size } = this;

    let r = radius;

    const passes = lw / dot_size;
    const mv = dot_size;

    for (let p = 0; p < passes; p++) {
      // do a pass on the circle
      const pts = [];
      for (let v = 0; v < 3; v++) {
        const theta = v / 3 * TAU;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;

        pts.push({x, y});
      }

      for (let v = 0; v < pts.length; v++) {
        // go through all of the vertices
        const p1 = (v == 0) ? pts[pts.length-1] : pts[v-1];
        const p2 = pts[v];

        const pdx = p2.x - p1.x;
        const pdy = p2.y - p1.y;

        const p1p2_dist = Math.sqrt(pdx * pdx + pdy * pdy);
        const no_dots = p1p2_dist / dot_size * this.fill;

        // draw the bunch of dots.
        for (let d = 0; d < no_dots; d++) {
          const t = Math.random();
          const dx = p1.x + t * pdx;
          const dy = p1.y + t * pdy;

          const ds = dot_size;

          ctx.beginPath();
          ctx.moveTo(dx * width, dy * height);
          ctx.arc(dx * width, dy * height, ds * width, 0, TAU);
          ctx.fill();
        }
      }

      r = r + mv;
    }
  }

  draw(ctx, colour, ...rest) {
    const {width, height, scale, dot_size, no_items } = this;

    const s = scale;
    const mv = this.max_radius / 20;

    super.draw(ctx);
    // now draw the ring back to the main canvas
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    for (let i = 0; i < no_items; i++) {
      // jitter the centre point
      const noisex = this.simplex.noise2D(this.translate.x * s, i * s);
      const noisey = this.simplex.noise2D(this.translate.y * s, i * s);
      const noiselw = this.simplex.noise2D(i * s, this.t * s);
      const lw = this.line_width + (noiselw * this.line_width);

      const noiserot = this.simplex.noise2D(i * s, this.t * s);

      ctx.save();
      ctx.translate(noisex * mv * width, noisey * mv * height );
      ctx.rotate(noiserot * TAU * 0.1);

      let radius;
      if (i == 0) {
        radius = this.max_radius * Math.random();
      } else {
        radius = this.max_radius / no_items * i;
      }

      const f = choose(['cross', 'line', 'triangle', 'circle']);

      this[f](ctx, colour, radius, lw);
      /**
      if (f == 1) {
        this.line(ctx, colour, radius, lw);
      } else if (f == 2) {
        this.triangle(ctx, colour, radius, lw);
      } else if (f == 3) {
        this.circle(ctx, colour, radius, lw);
      }
      **/

      ctx.restore();
    }

    ctx.restore();
  }
}

export default class GrafGeometry extends Drawable {
  // draws a ring made of up of noise distorted lines.
  constructor(options) {
    // build a new masked dots.

    const opts = options || {};
    opts.name = 'rings';
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
    const width = this.w();
    const height = this.h();
    const { pd_ctx, tx_ctx } = this;
    this.simplex = new SimplexNoise();

    const decals = rnd_range(20, 50);

    for (let d = 0; d < decals; d++) {
      const translate = {
        x: rnd_range(0.1, 0.9),
        y: rnd_range(0.1, 0.9)
      }

      this.enqueue(new Decal({
        alpha: rnd_range(0.6, 0.9),
        width, height,
        translate,
        fill: rnd_range(0.05, 0.25),
        dot_size: 0.001,
        line_width: rnd_range(0.003, 0.005),
        simplex: this.simplex,
        no_items: choose([1, 2, 2, 3, 3, 5]),
        max_radius: rnd_range(0.05, 0.15),
        scale: 0.5,
        colours: opts.fgs,
        t: d / decals
      }), opts.fgs[d % opts.fgs.length - 1]);
    }

    super.execute(opts);
  }
}


