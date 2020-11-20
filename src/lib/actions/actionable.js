import { TAU } from '../utils/geometry.js';

/**
 * Actionable defines an abstract class for an action to be taken on the
 * drawable interface. Each instance of an actionable is added to the
 * Drawable draw queue and then implemented in sequence.
 *
 * @abstract
 */
export default class Actionable {
  /**
   * Create the actionable
   *
   * @param {Object} options - an Actionable options object
   *
   */
  constructor(options) {
    // constructor always is by object due to the relative complexity
    // of each of the actions.
    const opts = options || {};
    this.height = opts.height || 100;
    this.width = opts.width || 100;
    this.alpha = opts.alpha || 0.5;
    this.translate = opts.translate || { x: 0, y:0 };
    this.rotate = opts.rotate || 0;
    this.t = opts.t || 0; // time or pass number
    // order of transformation operations - default translate -> rotate
    this.op_order = (opts.op_order || 'TR').toUpperCase();

    this.fill = opts.fill || null;
  }

  /**
   * Draws the action to the canvas. This super version only handles the
   * base transformations and manages the transformation order. It is assumed
   * to be called by the implementing class.
   *
   * @abstract
   *
   * @param {Context2D} ctx - context to act upon
   * @param {HSVColour} colour - HSV colour object to draw.
   */
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

  /**
   * Apply a fill to this actionable
   *
   * @param {Context2D} ctx - context to act upon
   */

  fill(ctx) {
    // check first we have a fill. Otherwise do nothing.
    if (this.fill) {
      this.fill.fill(ctx);
    }
  }
}
