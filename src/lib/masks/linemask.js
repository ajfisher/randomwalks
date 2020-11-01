'use strict';

import Mask from './mask.js';

export default class LineMask extends Mask {
  // creates a mask that basically creates a line which can be drawn to

  constructor(options) {
    const opts = options || {};
    super(opts);

    this.rotate = opts.rotate || 0;
    this.translate = opts.translate || { x: 0.5, y: 0.5};

    this.line_width = opts.line_width || 0.1;
    this.line_height = opts.line_height || 0.1;
  }

  clip(ctx) {
    // creates a mask that is a line that can be drawn in.
    const xt = this.translate.x * this.width;
    const yt = this.translate.y * this.height;

    // we start the path, save the context then do the translation and
    // rotation before drawing the clipping region. This allows us to do a
    // restoration within the draw action and then finally effect the clip
    // in the stack, which gets passed back. At the end of this we'll have
    // an appropriately rotated clip plane but the canvas will obey standard
    // orientation rules.
    //
    const lw = this.line_width * this.width;
    const lh = this.line_height * this.height;

    ctx.beginPath()
    ctx.save();
    ctx.translate(xt, yt);
    ctx.rotate(this.rotate);
    ctx.rect(-0.5 * lw, -0.5 * lh, lw, lh);
    ctx.restore();
    ctx.clip();
  }
}
