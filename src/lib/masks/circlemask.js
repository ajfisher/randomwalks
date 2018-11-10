'use strict';

import Mask from './mask';

const TAU = Math.PI * 2;

export default class CircleMask extends Mask {
  // creates a circular mask that can be drawn inside of.
  constructor(options) {
    const opts = options || {};
    super (opts);

    this.rotate = opts.rotate || 0;
    this.translate = opts.translate || { x: 0.5, y: 0.5};

    this.radius = opts.radius || 0.4;
  }

  clip(ctx) {
    const xt = this.translate.x * this.width;
    const yt = this.translate.y * this.height;

    // we start the path, save the context then do the translation and
    // rotation before drawing the clipping region. This allows us to do a
    // restoration within the draw action and then finally effect the clip
    // in the stack, which gets passed back. At the end of this we'll have
    // an appropriately rotated clip plane but the canvas will obey standard
    // orientation rules.
    const r = this.radius * this.width;

    ctx.beginPath()
    ctx.save();
    ctx.translate(xt, yt);
    ctx.arc(0, 0, r, 0, TAU);
    ctx.restore();
    ctx.clip();
  }
}
