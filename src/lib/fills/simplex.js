'use strict';

import Fillable from './fillable';

import { hsvts } from '../utils/draw';
import { rescale } from '../utils/maths';

export default class SimplexFill extends Fillable {
  // creates a fill on the object
  constructor(options) {
    const opts = options || {};
    super(opts);

    if (typeof(opts.simplex) === 'undefined') {
      throw new Error('Must pass a simplex noise object');
    }
    this.simplex = opts.simplex;
    this.scale = opts.scale || 0.1;
    this.steps = opts.steps || 256;
  }

  fill(ctx, colour=[0,0,0], ...rest) {
    // fills the location with simplex noise from 0 -> width and 0-> height

    const {width, height, scale, steps, translate } = this;

    ctx.save();
    if (this.mask) {
      this.mask.clip(ctx);
    } else {
      ctx.translate(translate.x, translate.y);
      ctx.rotate(this.rotate);
    }
    ctx.fillStyle = hsvts(colour);

    const mv = 1.0 / steps;
    const w = Math.ceil(width / steps);
    const h = Math.ceil(width / steps);

    for (let x = 0; x < steps; x++) {
      for (let y = 0; y < steps; y++) {
        const noise = this.simplex.noise2D(x * scale, y * scale);
        ctx.globalAlpha = rescale(-1.0, 1.0, 0.0, 1.0, noise);

        ctx.beginPath();
        const xp = (x * w);
        const yp = (y * h);

        ctx.rect(xp, yp, w, h);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
