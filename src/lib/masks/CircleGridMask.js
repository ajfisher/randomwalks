'use strict';

import Mask from './mask';

const TAU = Math.PI * 2;

export default class CircleGridMask extends Mask {
  // creates a grid of circular masks that can be drawn inside of.
  constructor(options) {
    const opts = options || {};
    super (opts);

    this.translate = opts.translate || { x: 0.5, y: 0.5};
    this.cols = opts.cols || 5;
    this.rows = opts.rows || 5;
    this.cell_size = opts.cell_size || (1.0 / this.cols);
    this.radius = opts.radius || 0.4;
  }

  clip(ctx) {
    super.clip(ctx);

    const {width, height, rows, cols, cell_size, radius} = this;

    const xt = this.translate.x * width;
    const yt = this.translate.y * height;

    // we start the path, save the context then do the translation and
    // rotation before drawing the clipping region. This allows us to do a
    // restoration within the draw action and then finally effect the clip
    // in the stack, which gets passed back. At the end of this we'll have
    // an appropriately rotated clip plane but the canvas will obey standard
    // orientation rules.
    const r = radius * width;

    ctx.beginPath()
    ctx.save();
    ctx.translate(xt, yt);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (row * cell_size) + (0.5 * cell_size);
        const y = (col * cell_size) + (0.5 * cell_size);
        ctx.moveTo(x*width, y*height);
        ctx.arc(x*width, y*height, r, 0, TAU);
      }
    }
    ctx.restore();
    ctx.clip();
  }
}

