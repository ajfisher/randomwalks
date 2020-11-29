import { TAU } from '../utils/geometry.js';

/**
 * Actionable defines an abstract class for an action to be taken on the
 * drawable interface. Each instance of an actionable is added to the
 * Drawable draw queue and then implemented in sequence.
 *
 * @interface
 * @category Action
 */
export class Actionable {
  /**
   * Create the actionable
   *
   * @param {Object} options - an Actionable options object
   *
   */
  constructor(options={}) {
    /**
     * The overall height of the canvas to draw to in pixels
     * @type {Number}
     */
    this.height = options.height || 100;
    /**
     * The overall width of the canvas i pixels
     * @type {Number}
     */
    this.width = options.width || 100;
    /**
     * The global alpha level to be set for any drawing actions 0..1
     * @type {Number}
     */
    this.alpha = options.alpha || 0.5;
    this.translate = options.translate || { x: 0, y:0 };
    /**
     * The rotation to be applied to this action before drawing in radians
     * @type {Number}
     */
    this.rotate = options.rotate || 0;
    /**
     * The time or pass number - can be used as an input to noise function or
     * animation sequences
     * @type {Number}
     */
    this.t = options.t || 0;
    /**
     * order of transformation operations - default translate -> rotate
     * @type {'TR' | 'RT'}
     */
    this.op_order = (options.op_order || 'TR').toUpperCase();
    /**
     * A fill object to specify a fill type on this drawing
     * @type {Fill}
     */
    this.fill = options.fill || null;
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

// Be explicit about the default export and also don't confuse JSDOC
export default Actionable;
