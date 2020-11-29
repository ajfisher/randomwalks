import Actionable from './actionable.js';
import { Line, BezierCurve } from '../primatives/Shape.js';
import { hsvts } from '../utils/draw.js';
import { TAU } from '../utils/geometry.js';

export { Polygon } from './poly.js';
export { Rectangle } from './rect.js';

/**
 * A drawable path that can be drawn to the context.
 * @extends Actionable
 */
export class DrawPath extends Actionable {
  /**
   * Create the actionable
   *
   * @param {Object=} options - the various options for this drawing
   * @param {Mask=} options.mask - a mask to apply to this drawing
   * @param {Point[]} options.points - List of {@link Point}s to draw.
   * @param {Number=} options.line_width - Stroke width of the arc
   *
   */
  constructor(options={}) {
    super(options);

    this.mask = options.mask || null;
    this.circle = options.circle || null;
    this.line_width = options.line_width || null;
    this.points = options.points || [];
  }

  /**
   * Draw the Path to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, points, line_width } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.lineWidth = line_width * width;

    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (let p = 1; p < points.length; p++) {
      ctx.lineTo(points[p].x * width, points[p].y * height);
    }
    ctx.stroke();

    // restore initial save
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }

    // now apply the fill
    super.fill(ctx, colour);
  }
}
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

    // now apply the fill
    super.fill(ctx, colour);
  }
}

/**
 * Draws an array of dots to the context
 * @extends Actionable
 */
export class DrawDotList extends Actionable {
  /**
   * Create the actionable
   * @param {Object=} options - the various options for this drawing
   * @param {Mask=} options.mask - a mask to apply to this drawing
   * @param {Circle[]} options.circles - A list of {@link Circle}s to draw
   * @param {Number=} options.line_width - Stroke width of the circle if given,
   *  otherwise the dot will be filled
   *
   */
  constructor(options={}) {
    super(options);

    this.mask = options.mask || null;
    this.circles = options.circles || [];
    this.line_width = options.line_width || null;
  }

  /**
   * Draw the items to the context
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */
  draw(ctx, colour, ...rest) {
    const { width, height, circles, line_width } = this;

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

    for (let c = 0; c < circles.length; c++) {
      const circle = circles[c];
      ctx.beginPath();
      ctx.arc(circle.x * width, circle.y * height, circle.r * width, 0, TAU);
      if (this.line_width) {
        ctx.stroke();
      } else {
        ctx.fill();
      }
    }

    // restore initial save
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }

    // now apply the fill
    super.fill(ctx, colour);
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

    // now apply the fill
    super.fill(ctx, colour);
  }
}

/**
 * Draw a set of lines from the queue to the screen
 * @extends Actionable
 * @category Action
 * @subcategory BasicAction
 */
export class DrawLineList extends Actionable {
  /**
   * Create the actionable
   *
   * @param {Object=} options - the various options for this drawing
   * @param {Mask=} options.mask - a mask to apply to this drawing
   * @param {Lines[]|BezierCurves[]} options.lines - An array of {@link Line} objects to draw with
   * @param {Number=} options.line_width - Width of stroke to use
   */
  constructor(options={}) {
    super(options);

    this.mask = options.mask || null;
    this.lines = options.lines || [];
    this.line_width = options.line_width || null;
  }

  /**
   * Draw the List of Lines to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, lines, line_width, t } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.lineWidth = line_width * width;

    for (let l = 0; l < lines.length; l++) {
    // just walk the line objects and draw lines between them
      const line = lines[l];
      ctx.beginPath();
      ctx.moveTo(line.start.x * width, line.start.y * height);
      if (line instanceof BezierCurve) {
        ctx.bezierCurveTo(
          line.cp1.x * width, line.cp1.y * height,
          line.cp2.x * width, line.cp2.y * height,
          line.end.x * width, line.end.y * height
        );
      } else {
        ctx.lineTo(line.end.x * width, line.end.y * height);
      }
      ctx.stroke();
    }

    // restore initial save
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }

    // now apply the fill
    super.fill(ctx, colour);
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

    // now apply the fill
    super.fill(ctx, colour);
  }
}

/**
 * Draw Triangle array from the queue to the screen
 * @extends Actionable
 *
 */
export class DrawTriangles extends Actionable {
  /**
   * Create the actionable
   *
   * @param {Object=} options - the various options for this drawing
   * @param {Mask=} options.mask - a mask to apply to this drawing
   * @param {Triangle[]} options.triangles - An array of {@link Triangle}s to draw with
   * @param {Number=} options.line_width - Width of stroke to use if provided,
   *  if not then the triangle will be filled.
   * @param {Number=} options.fill_chance - probability the triangle will be filled
   *
   */
  constructor(options={}) {
    super(options);

    this.mask = options.mask || null;
    this.triangles = options.triangles || [];
    this.line_width = options.line_width || null;
    this.fill_chance = options.fill_chance || 0.1;
  }

  /**
   * Draw the Triangles to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, triangles, line_width, fill_chance } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = hsvts(colour);
    ctx.strokeStyle = hsvts(colour);
    ctx.lineWidth = line_width * width;

    for (let t = 0; t < triangles.length; t++) {
      // set up the context with correct values for this iteration
      const points = triangles[t].points;

      // just walk the points of the triangle and draw the lines between them
      ctx.beginPath();
      ctx.moveTo(points[0].x * width, points[0].y * height);
      for (let p = 1; p < points.length; p++) {
        ctx.lineTo(points[p].x * width, points[p].y * height);
      }
      ctx.closePath();
      ctx.stroke();

      if (Math.random() < fill_chance) {
        ctx.fill();
      }
    }

    // restore initial save
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }

    // now apply the fill
    super.fill(ctx, colour);
  }
}
