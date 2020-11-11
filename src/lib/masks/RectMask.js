import Mask from './mask.js';

/**
 * Creates a Rectangle {@link Mask} on the canvas for drawing
 * @class
 * @extends Mask
 *
 */

export class RectMask extends Mask {
  /**
   * Create the Rectangle mask.
   * @param {MaskOptions} options - standard {@link MaskOptions} options
   * @param {Rect} options.rect - the rectangle to draw the mask.
   */

  constructor(options={}) {
    super (options);

    this.rect = options.rect; // TODO throw an error if not working
  }

  /**
   * Draw a rectangle clipping mask to the context
   *
   * @param {Context2D} ctx - 2D canvas context to apply the mask to
   *
   */

  clip(ctx) {
    const { rect, width, height, rotate, translate } = this;
    super.clip(ctx);

    const xt = translate.x * width;
    const yt = translate.y * height;

    // we start the path, save the context then do the translation and
    // rotation before drawing the clipping region. This allows us to do a
    // restoration within the draw action and then finally effect the clip
    // in the stack, which gets passed back. At the end of this we'll have
    // an appropriately rotated clip plane but the canvas will obey standard
    // orientation rules.

    ctx.beginPath()
    ctx.save();
    ctx.translate(xt, yt);

    // draw the rectangle
    ctx.moveTo(rect.x * width, rect.y * height);
    ctx.rect(rect.x * width, rect.y * height, rect.w * width, rect.h * height);

    if (this.invert) {
      // if inverted then we draw a "negative" plane across the whole canvas
      // this uses the winding rules to create a reverse mask between the two shapes
      // ctx.rect(width-xt, height-yt, -1 * width, height);
      ctx.rect(width-xt, -1*yt, -width, height);
    }

    ctx.restore();
    ctx.clip();
  }
}

