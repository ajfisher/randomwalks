'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import Drawable from './drawable';

import { best_contrast, hsvts, nrand, rank_contrast, range_map, rescale, rnd_range, weight_rnd } from './utils';

let canv_height = 0; // placeholder for static prop equiv
let canv_width = 0;
const colour_weights = [10, 5, 2, 1, 1];

class Rect {
  // builds a simple rectangle on the screen

  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  static config(options) {
    // configure the global rect object.

    const {height, width} = options || {};

    canv_height = height;
    canv_width = width;
  }

  draw(ctx, colours) {
    // draw the rectangle

    const weights = colour_weights.slice(0);
    while (colours.length < weights.length) {
      weights.pop();
    }
    // scale weight of 2nd and 3rd value based on x & y value
    weights[1] = rnd_range(weights[1],
      rescale(0, canv_width, weights[1], weights[1]+25, this.x));
    weights[2] = rnd_range(weights[2],
      rescale(0, canv_height, weights[2], weights[2]+25, this.y));

    const c = weight_rnd(colours, weights);

    // work out what hue this should be
    const h = Math.round(c[0]);
    // let yh_scale = Math.round(rescale(0, canv_height, 0, 15, this.y));
    const xa = 1.0 - rescale(0, 0.05*canv_width*canv_height, 0.5, 0.99, this.w * this.h);
    // console.log(this.w * this.h, xa);
    let rot = rescale(0, canv_height, 0, 90, this.y);
    rot = rnd_range(0.01, rot);

    // yh_scale = 0;
    // console.log(this.y, yh_scale);
    // h = rnd_range(h-yh_scale, h + yh_scale);
    const s = c[1];
    const v = c[2];

    ctx.fillStyle = hsvts([h, s, v]);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0)';
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(rot * Math.PI / 180);
    ctx.globalAlpha = Math.abs(xa); // rnd_range(0.05, Math.abs(xa));
    // draw a series of lines
    const xw = rnd_range(1, 4) * 2;
    const xg = xw + rnd_range(2, 5);
    // console.log(xw, xg);
    for (let x = 0; x < this.w; x=x+xg) {
      const ys = rnd_range(-0.1*this.h, 0.1*this.h);
      const yf = rnd_range(-0.1*this.h, 0.1*this.h);
      ctx.save()
      const r = rnd_range(0.5, 1.5);
      ctx.rotate(r * Math.PI / 180);
      ctx.fillRect(x, ys, xw, this.h+yf);
      ctx.restore()
    }
    // do a rect fill using dots (50% fill)
    // const min_width = 0.5 * this.w;
    // ctx.fillRect(0, 0, min_width, this.h);
    /**
    for (let y = 0; y < this.h; y=y+7) {
      for (let x = 0; x < this.w; x=x+7) {
        ctx.fillRect(x, y, 4, 4);
        // const z = Math.abs(nrand(0, this.w * 0.5));
        // console.log(z);
        // x = x + z;
        // ctx.beginPath();
        // ctx.arc(x, y, 1, 0, 2 * Math.PI, false);
        // ctx.fill();
      }
    }
    **/
    // ctx.fillRect(0, 0, this.w, this.h);
    ctx.restore();
  }
}

export default class Poly extends Drawable {
  // poly class creates a polygon

  constructor(options) {
    super(options);

    const opts = options || {};
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

    Rect.config({height: this.h(), width: this.w()});
    // add the specific drawing actions now
    const palette = this.palette;

    const { bg, fgs } = rank_contrast(palette);

    opts.bg = bg;
    opts.fg = fgs[0];
    opts.fgs = fgs;

    // draw rectangles across the screen with differing values.
    this.no_rects = rnd_range(200, 400);
    console.log(this.no_rects);
    for (let i = 0; i < this.no_rects; i++) {
      // get some values
      const x = rnd_range(-0.1, 1.0);
      const y = rnd_range(-0.1, 1.0);
      const w = rnd_range(0.01, 0.2);
      const h = rnd_range(0.01, 0.3);

      this.enqueue(
        new Rect(this.w(x), this.h(y), this.w(w), this.h(h)),
        opts.fgs);
    }

    // now execute the drawing.
    super.execute(opts);
  }
}
