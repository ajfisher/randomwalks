export { Polygon } from './poly.js';
export { Rectangle } from './rect.js';

import Actionable from './actionable.js';
import { hsvts } from '../utils/draw.js';
import { TAU } from '../utils/geometry.js';

/**
 * A drawable arc that can be drawn to the context.
 * @extends Actionable
 */
export class DrawArc extends Actionable {
  /**
   * Create the actionable
   *
   * @param {Object=} options - the various options for this drawing
   * @param {Mask=} options.mask - a mask to apply to this drawing
   * @param {Point} options.circle - A {@link Circle} to draw with
   * @param {Number=} options.start - The starting point of the arc
   * @param {Number=} options.end - The ending point of the arc
   * @param {Number=} options.line_width - Stroke width of the arc
   *
   */
  constructor(options={}) {
    super(options);

    this.mask = options.mask || null;
    this.circle = options.circle || null;
    this.start = options.start || 0;
    this.end = options.end || TAU;
    this.line_width = options.line_width || null;
    this.line_cap = options.line_cap || null;
  }

  /**
   * Draw the Arc to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, circle, start, end, line_width } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.lineWidth = line_width * width;
    if (this.line_cap) {
      ctx.lineCap = this.line_cap;
    }

    ctx.beginPath();
    ctx.arc(circle.x * width, circle.y * height, circle.r * width, start, end);
    ctx.stroke();

    // restore initial save
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }
  }
}

/**
 * A drawable dot / circle that can be drawn to the context.
 * @extends Actionable
 */
export class DrawDot extends Actionable {
  /**
   * Create the actionable
   *
   * @param {Object=} options - the various options for this drawing
   * @param {Mask=} options.mask - a mask to apply to this drawing
   * @param {Point} options.dot - A {@link Point} to draw with
   * @param {Number=} options.r - The radius to draw the dot
   * @param {Number=} options.line_width - Stroke width of the circle if given,
   *  otherwise the dot will be filled
   *
   */
  constructor(options={}) {
    super(options);

    this.dot_width = options.dot_width || 0.001;
    this.mask = options.mask || null;
    this.dot = options.dot || null;
    this.r = options.r || 0.01;
    this.line_width = options.line_width || null;
  }

  /**
   * Draw the Dot to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, dot, r } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);
    if (this.line_width) {
      ctx.lineWidth = this.line_width * width;
    }

    ctx.beginPath();
    ctx.arc(dot.x * width, dot.y * height, r * width, 0, TAU);
    if (this.line_width) {
      ctx.stroke();
    } else {
      ctx.fill();
    }

    // restore initial save
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }
  }
}

/**
 * Draw a triangle from the queue to the screen
 * @extends Actionable
 *
 */
export class DrawTriangle extends Actionable {
  /**
   * Create the actionable
   *
   * @param {Object=} options - the various options for this drawing
   * @param {Mask=} options.mask - a mask to apply to this drawing
   * @param {Triangle} options.triangle - A {@link Triangle} to draw with
   * @param {Number=} options.line_width - Width of stroke to use if provided,
   *  if not then the triangle will be filled.
   *
   */
  constructor(options={}) {
    super(options);

    this.mask = options.mask || null;
    this.triangle = options.triangle || null;
    this.line_width = options.line_width || null;
  }

  /**
   * Draw the Triangle to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, triangle, line_width, t } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    const points = triangle.points;

    // just walk the points of the triangle and draw the lines between them
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (let p = 1; p < points.length; p++) {
      ctx.lineTo(points[p].x * width, triangle.points[p].y * height);
    }
    ctx.closePath();
    if (line_width) {
      ctx.lineWidth = line_width * width;
      ctx.stroke();
    } else {
      ctx.fill();
    }

    // restore initial save
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }
  }
}
