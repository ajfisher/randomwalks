import Actionable from './actionable.js';

import { hsvts } from '../utils/draw.js';

/**
 * Class that draws a Rectangle
 *
 * @extends Actionable
 * @category Action
 * @subcategory BasicAction
 */

export class DrawRect extends Actionable {
  /**
   * Create a Rectangle actionable to draw it.
   *
   * @param {Object=} options - The options object to control
   * @param {Rect} options.rect - The {@link Rect} object to draw
   * @param {Number=} options.line_width - Width of line to draw as proportion of canvas
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

/**
 * Draws a list of rectangles out to the canvas
 * @extends Actionable
 * @category Action
 * @subcategory BasicAction
 */
export class DrawRectList extends Actionable {
  /**
   * Create a DrawRectList actionable to draw it.
   *
   * @param {Object=} options - The options object to control
   * @param {Rect[]} options.rects - An array of {@link Rect} objects to draw
   * @param {Mask=} options.mask - A {@link Mask} to apply to this action
   * @param {Boolean=} options.fill - Determine if the rects are filled or not
   *
   */

  constructor(options={}) {
    super(options);

    this.line_width = options.line_width || 0.001;
    this.rects = options.rects || [];
    this.mask = options.mask || null;
    this.fill = options.fill || false;
  }

  /**
   * Draw the Rectangles to the context
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, rects, line_width, fill } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.lineWidth = this.line_width * width;
    ctx.globalAlpha = this.alpha;
    if (colour) {
      ctx.strokeStyle = hsvts(colour);
      ctx.fillStyle = hsvts(colour);
    }

    for (const rect of rects) {
      ctx.beginPath();
      ctx.moveTo(rect.x * width, rect.y * height);
      ctx.rect(rect.x * width, rect.y * height, rect.w * width, rect.h * height);
      if (rect.colour) {
        ctx.strokeStyle = hsvts(rect.colour);
        ctx.fillStyle = hsvts(rect.colour);
      }
      if (rect.alpha) {
        ctx.globalAlpha = rect.alpha;
      }

      if (fill) {
        ctx.fill();
      }
      ctx.stroke();
    }

    // restore the original context save.
    ctx.restore();

    if (this.mask) {
      ctx.restore();
    }
  }
}
