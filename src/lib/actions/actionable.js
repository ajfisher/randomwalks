'use strict';

const TAU = Math.PI * 2;

export default class Actionable {
  // Actionable defines an abstract class for an action to be taken on the
  // Drawable interface. Each instance of an Actionable is added to the
  // Drawable draw queue and is then implemented in sequence.

  constructor(options) {
    // constructor always is by object due to the relative complexity
    // of each of the actions.
    const opts = options || {};
    this.height = opts.height || 100;
    this.width = opts.height || 100;
    this.alpha = opts.alpha || 0.5;
    this.translate = opts.translate || { x: 0, y:0 };
    this.rotate = opts.rotate || 0;
    this.t = opts.t || 0; // time or pass number
    // order of transformation operations - default translate -> rotate
    this.op_order = (opts.op_order || 'TR').toUpperCase();
  }

  draw(ctx, colour, ...rest) {
    // draws the action to the canvas. This only handles the appropriate
    // transformation steps depending on the order that is provided.

    const {op_order} = this;
    for (let i = 0; i < op_order.length; i++) {
      const op = op_order[i];

      if (op === 'T') {
        ctx.translate(this.translate.x * this.width, this.translate.y * this.height);
      } else if (op === 'R') {
        ctx.rotate(this.rotate * TAU);
      }
    }

    ctx.globalAlpha = this.alpha;
  }
}
