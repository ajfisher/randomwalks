'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import Drawable from './drawable';

import { best_contrast, hsvts, nrand, rank_contrast, range_map, rescale, rnd_range, weight_rnd } from './utils';

export default class Split extends Drawable {
  // split class creates a split screen with a colout.

  constructor(options) {
    const opts = options || {};
    opts.name = 'splits';
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

    opts.bg = [47, 6, 100];
    opts.fg1 = bg;
    opts.fg2 = fgs[0];
    opts.fgs = fgs;

    // now execute the drawing.
    super.execute(opts);

    // let's just draw some basics for now.
    const { ctx } = this;

    const border = this.w(0.06);
    const total_w = this.w() - 2 * border;
    const total_h = this.h() - 2 * border;
    const x_l = border;
    const y_t = border;

    const top_split = Math.floor(0.619 * total_h);
    const bottom_split = Math.floor(total_h - top_split);

    ctx.fillStyle = hsvts(opts.fg1);
    ctx.fillRect(x_l, y_t, total_w, top_split);
    ctx.fillStyle = hsvts(opts.fg2);
    ctx.fillRect(x_l, y_t + top_split, total_w, bottom_split);
    ctx.save();
    ctx.translate(x_l, y_t + top_split);
    const grains = 30;
    const grain_size = Math.floor(this.cm(0.01));  // 0.5mm grain
    ctx.globalAlpha = 0.05;
    for (let x = 0; x < total_w - grain_size; x = x + grain_size) {
      for (let i = 0; i < grains; i++ ) {
        // choose a point somewhere in the range of -top -> +bottom
        const y = Math.floor(rnd_range(0.9*-top_split, 0.9*bottom_split));
        let y2;
        if (y < 0) {
          y2 = rnd_range(y, 0);
          ctx.fillStyle = hsvts(opts.fg2);
        } else {
          y2 = rnd_range(0, y);
          ctx.fillStyle = hsvts(opts.fg1);
        }
        ctx.fillRect(x, y2, grain_size, y-y2);
      }
    }
    ctx.restore();
  }
}

