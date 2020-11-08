import Mask from './mask.js';

/**
 * Creates a polygon {@link Mask} on the canvas for drawing
 * @class
 * @extends Mask
 *
 */

export class PolyMask extends Mask {
  /**
   * Create the polygonal mask.
   * @param {MaskOptions} options - standard {@link MaskOptions} options
   * @param {Number} options.points - the points for the polygon.
   */

  constructor(options={}) {
    const opts = options;
    super (opts);

    this.points = options.points || [];
  }

  /**
   * Draw a polygon clipping mask to the context
   *
   * @param {Context2D} ctx - 2D canvas context to apply the mask to
   *
   */

  clip(ctx) {
    const { points, width, height, rotate, translate } = this;
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

    // draw the polygon
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (let p = 1; p < points.length; p++) {
      const pt = points[p];
      ctx.lineTo(pt.x * width, pt.y * height);
    }
    ctx.lineTo(points[0].x * width, points[0].y * height);

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

