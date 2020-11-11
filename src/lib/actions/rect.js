import Actionable from './actionable.js';

import { hsvts } from '../utils/draw.js';

/**
 * Class that draws a Rectangle
 *
 * @extends Actionable
 */

export default class Rectangle extends Actionable {
  /**
   * Create a Rectangle actionable to draw it.
   *
   * @param {Object=} options - The options object to control
   * @param {Rect} options.rect - The {@link Rect} object to draw
   * @param {number} options.line_width - Width of line to draw as %
   * @param {Mask=} options.mask - A {@link Mask} to apply to this action
   * @param {Boolean=} options.fill - Determine if the rectangle is filled or not
   *
   */

  constructor(options={}) {
    super(options);

    this.line_width = options.line_width || 0.001;
    this.rect = options.rect || [];
    this.mask = options.mask || null;
    this.fill = options.fill || false;
  }

  /**
   * Draw the Rectangle to the context
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, rect, line_width, fill } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.lineWidth = this.line_width * width;
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    ctx.beginPath();
    ctx.moveTo(rect.x * width, rect.y * height);
    ctx.rect(rect.x * width, rect.y * height, rect.w * width, rect.h * height)
    if (fill) {
      ctx.fill();
    }
    ctx.stroke();


    // restore the original context save.
    ctx.restore();

    if (this.mask) {
      ctx.restore();
    }
  }
}
