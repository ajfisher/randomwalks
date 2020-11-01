'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable';

import { Actionable }  from './actions';
import { ApplyGrain } from './concentrics';

import { choose, rnd_range } from './utils/random';
import { hsvts, rank_contrast } from './utils/draw';

// bring in the Path2D polyfill if in node.
import 'canvas-5-polyfill';

const TAU = Math.PI * 2;

class Stem extends Actionable {
  // draws the actual stem of grass.
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.simplex = opts.simplex || false;
    this.stem_width = opts.stem_width || 0.006;
  }

  draw(ctx, colour, ...rest) {
    // draws a stem

    const { width, height, simplex } = this;
    super.draw(ctx);

    // should now be translated etc so it's just a case of drawing a line out
    const mv = rnd_range(0.015, 0.03);
    const joints = rnd_range(20, 60);
    const scale = choose([0.7, 0.5, 0.6]);
    const s = scale;

    // used to deal with aspect_ratio fixes.
    let ar_size = width;
    if (width > height) {
      ar_size = height;
    }

    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);
    // just get the stem width to something that looks roughly right
    ctx.lineWidth = this.stem_width * ar_size;
    ctx.globalAlpha = this.alpha;
    ctx.lineCap = 'round';

    let x = 0;
    let y = 0;

    // let minx = 0;
    // let maxx = 0;

    // ctx.beginPath();

    const min_dot = 0.01;
    const max_dot = 0.015;

    const stem_path = new Path2D();
    stem_path.moveTo(x * width, y * height);

    for (let j = 0; j < joints; j++) {
      y = y - mv;
      const noise = simplex.noise2D(x * s, y * s);
      x = x + (noise * mv);

      ctx.beginPath();
      ctx.moveTo(x * width, y * height);

      const dot_size = rnd_range(min_dot, max_dot);
      let dots = 0; // choose([0,0,1,2,2,2]);

      // choose where the bottom dot will be
      const b_dot = rnd_range(0.05, 0.15);

      if (j < b_dot * joints) {
        dots = 0;
      } else if (j % 2 == 0) {
        dots = choose ([0,0,1,2,2,2,2]);
      } else {
        dots = choose ([0,0,0,1,1,1,2]);
      }

      for (let d = 0; d < dots; d++) {
        // draw the dots
        let dy = y;
        const dynoise = simplex.noise3D(x*s, dy*s, d*s);
        dy = dy + (dynoise * mv);

        let dx = 0;
        const dxnoise = simplex.noise3D(dx*s, y*s, d*s);

        if (dots == 2) {
          if (d == 0) {
            // put it to left of the stem
            dx = x - this.stem_width - (Math.abs(dxnoise) * dot_size);
          } else {
            // put it to the right of the stem
            dx = x + this.stem_width + (Math.abs(dxnoise) * dot_size);
          }
        } else {
          dx = x + (dxnoise * dot_size);
        }

        const alpha_noise = simplex.noise2D(dx, dy);
        const glow_size = rnd_range(4, 40) * dot_size;

        ctx.save();
        ctx.globalAlpha = this.alpha + (alpha_noise * this.alpha);
        ctx.shadowColor = hsvts([colour[0], 100.0, colour[2]]);
        ctx.shadowBlur = glow_size * ar_size;

        ctx.moveTo(dx, dy);

        ctx.arc(dx*width, dy*height, dot_size*ar_size, 0, TAU);
        ctx.fill();
        ctx.restore();
      }

      stem_path.lineTo(x * width, y * height);
    }

    ctx.save();
    ctx.globalAlpha = this.alpha * 2;
    ctx.stroke(stem_path);
    ctx.restore();
  }
}

export default class Grasses extends Drawable {
  // Grasses draws a set of grasses running up the screen that replicates
  // the sort of thing like a screen print.

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'grasses';
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
    const border = Math.floor(this.w(this.border));
    const width = this.w(); // - 2 * border;
    const height = this.h(); // - 2 * border;

    const stems = rnd_range(40, 60);

    this.enqueue(new ApplyGrain({
      alpha: 0.25,
      width, height,
      no: rnd_range(200, 1500),
      min: 0.002,
      max: 0.004
    }), opts.fgs[1]);

    this.simplex = new SimplexNoise();

    for (let s = 0; s < stems; s++) {
      // build a bunch of stems

      const x = rnd_range(0.15, 0.85);

      this.enqueue(new Stem({
        alpha: rnd_range(0.2, 0.4),
        width, height,
        translate: { x, y: 1.0 },
        rotate: rnd_range(-0.02, 0.02) * TAU,
        simplex: this.simplex,
        t: s
      }), opts.fgs[s % 4]);
    }

    this.enqueue(new ApplyGrain({
      alpha: 0.5,
      width, height,
      no: rnd_range(400, 400),
      min: 0.002,
      max: 0.004
    }), opts.fgs[1]);
    super.execute(opts);
  }
}


