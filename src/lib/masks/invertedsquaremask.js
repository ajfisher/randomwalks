'use strict';

import Mask from './mask.js';

export default class InvertedSquareMask extends Mask {
  // creates a mask that is an inversion of a square
  constructor(options) {
    const opts = options || {};
    super(opts);
    this.r_w = opts.r_w || 0.4;
    this.r_h = opts.r_h || 0.4;
  }

  clip(ctx) {
    // draw the various parts of the clipping path
    super.clip(ctx);
    const { width, height, r_w, r_h } = this;

    const outer_h = (1.0 - r_h) / 2;
    const outer_w = (1.0 - r_w) / 2;

    ctx.beginPath();
    ctx.rect(0, 0, width, outer_h * height);
    ctx.rect(0, (r_h + outer_h) * height, width, outer_h * height);
    ctx.rect(0, 0, outer_w * width, height);
    ctx.rect((r_w + outer_w) * width, 0, outer_w * width, height);
    ctx.clip();
  }
}
