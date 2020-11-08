import Mask from './mask.js';
import { TAU } from '../utils/geometry.js';

/**
 * Creates a circular {@link Mask} on the canvas for drawing
 * @class
 * @extends Mask
 *
 */

export default class CircleMask extends Mask {
  /**
   * Create the circular mask.
   * @param {MaskOptions} options - standard {@link MaskOptions} options
   * @param {Number} options.radius - the radius of the mask from the centre
   */

  constructor(options={}) {
    const opts = options;
    super (opts);

    this.radius = opts.radius || 0.4;
  }

  /**
   * Draw a circular clipping mask to the context
   *
   * @param {Context2D} ctx - 2D canvas context to apply the mask to
   *
   */

  clip(ctx) {
    const { radius, width, height, rotate, translate } = this;
    super.clip(ctx);

    const xt = translate.x * width;
    const yt = translate.y * height;

    // we start the path, save the context then do the translation and
    // rotation before drawing the clipping region. This allows us to do a
    // restoration within the draw action and then finally effect the clip
    // in the stack, which gets passed back. At the end of this we'll have
    // an appropriately rotated clip plane but the canvas will obey standard
    // orientation rules.
    const r = radius * width;

    ctx.beginPath()
    ctx.save();
    ctx.translate(xt, yt);
    ctx.arc(0, 0, r, 0, TAU);

    if (this.invert) {
      // if inverted then we draw a "negative" plane across the whole canvas
      // this uses the winding rules to create a reverse mask between the two shapes
      ctx.rect(0.5 * width, -0.5 * height, -1 * width, height);
    }

    ctx.restore();
    ctx.clip();
  }
}
