/**
 * Abstract class definition for a Mask to define an area of
 * the canvas to draw on and not go outside that boundary.
 * @class
 * @abstract
 *
 */

export default class Mask {
  /**
   * Create the Mask
   *
   * @param {Object=} options - a {@link MaskOptions} object
   *
   * @typedef {Object} MaskOptions
   * @prop {Number} height - height of the containing context
   * @prop {Number} width - width of the containing context
   * @prop {Number} rotate - amount, in radians to rotate before drawing the Mask
   * @prop {Point} translate - the {@link Point} to translate to before drawing the mask
   * @prop {Boolean} invert - whether to invert the mask (ie draw outside the path)
   *
   */

  constructor(options={}) {
    const opts = options;
    this.height = opts.height || 10;
    this.width = opts.width || 10;
    this.rotate = opts.rotate || 0;
    this.translate = opts.translate || {x: 0.5, y: 0.5};
    this.invert = opts.invert || false;
  }

  /**
   * Draw the clipping mask to the context
   *
   * @param {Context} ctx - Canvas drawing context to draw to
   *
   */

  clip(ctx) {
    // abstract interface for the mask drawing actions.
    if (typeof(ctx) === 'undefined') {
      throw new Error('Clip must take a context as an argument');
    }

    // TODO change this to apply translation and roation here.
  }
}
