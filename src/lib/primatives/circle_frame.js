'use strict';

import { Actionable } from '../actions';

import { hsvts } from '../utils/draw';

const TAU = Math.PI * 2;

export default class Frame extends Actionable {
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.radius = opts.radius || 0.4;
    this.line_width = opts.line_width || 0.01;
  }

  draw(ctx, colour, ...rest) {
    const {width, height, translate, radius, line_width} = this;

    ctx.save();
    ctx.lineWidth = line_width * width;
    ctx.strokeStyle = hsvts(colour);
    ctx.globalAlpha = this.alpha;
    ctx.translate(translate.x*width, translate.y*height);
    ctx.beginPath()
    ctx.arc(0, 0, radius * width, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}


