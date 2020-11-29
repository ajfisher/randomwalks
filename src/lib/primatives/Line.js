import { Point } from './Point.js';

/**
 * Defines a line that is a sequence of 2 points
 *
 * @class
 * @category Primitives
 */
export class Line {
  /**
   * create a new Line
   *
   * @constructor
   * @param {Point=} p1 - starting {@link Point} for the line
   * @param {Point=} p2 - ending {@link Point} for the line
   *
   * @example
   *
   * let p1 = new Point(0.2, 0.2);
   * let p2 = new Point(0.5, 0.5);
   *
   * let line = new Line(p1, p2);
   */
  constructor(p1=new Point(0, 0), p2=new Point(1,1)) {
    /**
     * The start {@link Point} of the line
     * @type {Point}
     */
    this.start = p1;
    /** The end {@link Point} of the Line
     * @type {Point}
     */
    this.end = p2;
  }

  /**
   * The length of this line
   * @type {Number}
   * @readonly
   */
  get length() {
    return this.start.distance(this.end);
  }

  /**
   * The angle, in radians from the start {@link Point} to the end {@link Point}
   * @type {Number}
   * @readonly
   */
  get angle() {
    // assume start point is the centre, and endpoint is on a cicle perimeter
    return this.start.angle_to(this.end);
  }
  /**
   * The {@link Point} half way along the lines
   * @type {Point}
   * @readonly
   */
  get midpoint() {
    const {start: p1, end: p2} = this;
    return new Point(
      (p2.x - p1.x) / 2,
      (p2.y - p1.y) / 2
    );
  }

  /**
   * Interpolates between the two ends of the lines from start to end
   * @param {Number} t - the proportion of the line to interpolate 0..1
   * @return {Point} the {@link Point} representing the interpolation
   */
  lerp(t) {
    const { start: p1, end: p2} = this;
    const x_dist = p2.x - p1.x;
    const y_dist = p2.y - p1.y;

    return new Point(p1.x + (x_dist * t), p1.y + (y_dist * t));
  }
}

/**
 * Defines a Bezier curve line that is two anchor points and two control points
 *
 * @class
 * @extends Line
 * @category Primitives
 */
export class BezierCurve extends Line {
  /**
   * create a new Bezier Curve
   *
   * @constructor
   * @param {Point=} p1 - starting {@link Point} for the line
   * @param {Point=} p2 - ending {@link Point} for the line
   * @param {Point=} cp1 - first control {@link Point}
   * @param {Point=} cp2 - second control {@link Point}
   *
   * @example
   *
   * let p1 = new Point(0.2, 0.2);
   * let p2 = new Point(0.5, 0.5);
   *
   * let line = new Line(p1, p2);
   */
  constructor(
    p1=new Point(0, 0), p2=new Point(1,1),
    cp1=new Point(0.5, 0.5), cp2=new Point(0.5, 0.5)
  ) {
    super(p1, p2);
    /**
     * The first control {@link Point} of the line
     * @type {Point}
     */
    this.cp1 = cp1;
    /** The second control {@link Point} of the Line
     * @type {Point}
     */
    this.cp2 = cp2;
  }


  /**
   * Interpolates between the two ends of the lines from start to end
   * @param {Number} t - the proportion of the line to interpolate 0..1
   * @return {Point} the {@link Point} representing the interpolation
   */
  lerp(t) {
    // TODO reimplement this
    const { start: p1, end: p2} = this;
    const x_dist = p2.x - p1.x;
    const y_dist = p2.y - p1.y;

    return new Point(p1.x + (x_dist * t), p1.y + (y_dist * t));
  }
}
