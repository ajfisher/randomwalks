'use strict';

import Mask from './mask';

export default class BlockMask extends Mask {
  // creates a mask that basically creates a line going through
  // the canvas
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.rotate = opts.rotate || 0;
    this.translate = opts.translate || { x: 0.5, y: 0.5};
  }

  clip(ctx) {
    // creates a mask that is a division block that can be drawn in.
    const xt = this.translate.x * this.width;
    const yt = this.translate.y * this.height;

    // we start the path, save the context then do the translation and
    // rotation before drawing the clipping region. This allows us to do a
    // restoration within the draw action and then finally effect the clip
    // in the stack, which gets passed back. At the end of this we'll have
    // an appropriately rotated clip plane but the canvas will obey standard
    // orientation rules.
    ctx.beginPath()
    ctx.save();
    ctx.translate(xt, yt);
    ctx.rotate(this.rotate);
    ctx.rect(-this.width, 0, this.width * 2, this.height);
    ctx.restore();
    ctx.clip();
  }
}

