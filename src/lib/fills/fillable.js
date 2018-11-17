'use strict';

const TAU = Math.PI * 2;

export default class Fillable {
  // Fillable defines an abstract class for a method of filling a space
  // normally provided by a clipping path (so it doesn't over spill).

  constructor(options) {
    // create a fillable
    const opts = options || {};

    this.height = opts.height || 100;
    this.width = opts.width || 100;

    this.rotate = opts.rotate || 0.0;
    this.translate = opts.translate || {x: 0, y: 0};
    this.alpha = opts.alpha || 0.5;

    // clipping path possibly supplied.
    this.mask = opts.mask || false;

    // is the fill a regular fill or an irregular one.
    this.regular = opts.regular || false;

    // how much fill are are we providing
    this.density = opts.density || 0.5;
  }

  fill(ctx, colour, ...rest) {
    // defines a method to fill the masked path.
    // default is to simply fill it with the colour supplied at 100%
    ctx.save();
    if (this.mask) {
      this.mask.clip();
    } else {
      ctx.translate(this.translate.x, this.translate.y);
      ctx.rotate(this.rotate);
    }

    ctx.fillStyle = hsvts(colour);
    ctx.globalAlpha = this.alpha;
    ctx.beginPath()
    ctx.rect(0, 0, this.width, this.height)
    ctx.fill();
    ctx.restore();
  }
}

