'use strict';

// draws the border around the outside of a frame

import { hsvts } from '../utils.js';

export default class Border {
  // puts a border around the image

  constructor(border, w, h, colour) {
    this.border = border || 1;
    this.w = w || 100;
    this.h = h || 100;
  }

  draw(ctx, colour) {
    // draws the border
    const {border, w, h} = this;
    const c = colour || this.colour;
    ctx.fillStyle = hsvts(c);
    ctx.fillRect(0, 0, w, border);
    ctx.fillRect(0, border, border, h);
    ctx.fillRect(0, h-border, w, border);
    ctx.fillRect(w-border, 0, border, h);
  }
}

