'use strict';

import { Actionable } from '../actions/index.js';

import { hsvts } from '../utils/draw.js';

const TAU = Math.PI * 2;

export default class Frame extends Actionable {
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.radius = opts.radius || 0.4;
    this.line_width = opts.line_width || 0.01;
    this.extent = opts.extent || {start: 0, end: 1}; // extent of tau to draw
  }

  draw(ctx, colour, ...rest) {
    const {width, height, translate, radius, line_width} = this;
    const {start, end} = this.extent;

    ctx.save();
    ctx.lineWidth = line_width * width;

    if (end < 1.0) {
      ctx.lineCap = 'round';
    }

    ctx.strokeStyle = hsvts(colour);
    ctx.globalAlpha = this.alpha;
    ctx.translate(translate.x*width, translate.y*height);
    ctx.beginPath()
    ctx.arc(0, 0, radius * width, start * TAU, end * TAU);
    ctx.stroke();
    ctx.restore();
  }
}


