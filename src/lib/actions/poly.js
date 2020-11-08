import Actionable from './actionable.js';

import { hsvts } from '../utils/draw.js';
import { TAU } from '../utils/geometry.js';

/**
 * Class that draws a Polygon
 *
 * @extends Actionable
 */

export default class Polygon extends Actionable {
  /**
   * Create a Polygon actionable to draw it.
   *
   * @param {Object=} options - The options object to control
   * @param {number} options.line_width - Width of line to draw as %
   * @param {Point[]} options.points - Array of {@link Point} objects
   * @param {string=} options.style - One of 'POINTS', 'LINES', 'BOTH'
   * @param {Point=} options.centroid - A {@link Point} representing the centre
   *
   */

  constructor(options={}) {
    const opts = options;
    super(opts);

    this.line_width = opts.line_width || 0.001;
    this.points = opts.points || [];
    this.style = opts.style || 'POINTS';
    this.centroid = opts.centroid || null;
  }

  /**
   * Draw the polygon to the context
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, points, line_width, centroid } = this;

    super.draw(ctx);

    ctx.save();
    ctx.lineWidth = this.line_width * width;
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    // draw the lines
    if (this.style === 'LINES' || this.style === 'BOTH') {
      ctx.beginPath();
      ctx.moveTo(points[0].x * width, points[0].y * height);
      for (let p = 1; p < points.length; p++) {
        const pt = points[p];
        ctx.lineTo(pt.x * width, pt.y * height);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // draw the points
    if (this.style === 'POINTS' || this.style === 'BOTH') {
      ctx.globalAlpha = this.alpha * 1.1;
      for (let p = 0; p < points.length; p++) {
        const pt = points[p];
        ctx.beginPath();
        ctx.moveTo(pt.x * width, pt.y * height);
        ctx.arc(pt.x * width, pt.y * height, 10, 0, TAU);
        ctx.fill();
      }
    }

    if (centroid) {
      // draw the centre point
      ctx.beginPath();
      console.log(centroid);
      ctx.moveTo(centroid.x * width, centroid.y * height);
      ctx.arc(centroid.x * width, centroid.y * height, 10, 0, TAU);
      ctx.fill();
    }

    // restore original transform
    ctx.restore();
  }
}

