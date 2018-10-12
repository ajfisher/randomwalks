'use strict';

import { Actionable } from '../actions';
import { hsvts } from '../utils';

const TAU = Math.PI * 2;

export default class Block extends Actionable {
  // Creates a block of colour across the canvas.
  // draws a block of colour

  constructor(options) {
    // sets up a block of colour to draw.
    //
    const opts = options || {}
    super(opts);

    this.colour = opts.colour || [0, 100, 100];

    this.mirror = opts.mirror || false;
  }

  draw(ctx, colour) {
    // draws a block of colour, first by translating to the x,y coord
    // and then drawing a block for the width and the height.
    // Can optionally take a mirror option where it will draw the same block
    // mirrored back along the line of rotation.
    const {width, height, mirror} = this;

    ctx.save();
    super.draw(ctx, colour);
    ctx.fillStyle = hsvts(colour);
    ctx.fillRect(0, 0, width, height);
    if (mirror) {
      const dir = (height < 0) ? -1 : 1;
      ctx.fillRect(dir, 0, -width, height);
    }
    ctx.restore();
  }
}
