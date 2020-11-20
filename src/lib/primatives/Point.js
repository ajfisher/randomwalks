/**
 * Defines a Point to be used in the system using local coordinate values
 *
 * @class
 * @property {Number} x - The X position of the Point
 * @property {Number} y - The Y position of the Point
 */
export class Point {
  /**
   * create a new Point
   *
   * @constructor
   * @param {Number=} x - X position of the point
   * @param {Number=} y - Y position of the point
   *
   * @example
   *
   *  new Point(0.5, 0.5)
   *
   */
  constructor(x=0, y=0) {
    this._x = x;
    this._y = y;
  }

  /**
   * @example
   *
   * let p = new Point(0.5, 0.5);
   * console.log(p.x);
   * p.x = 0.2;
   * console.log(p.x);
   *
   */
  get x() {
    return this._x;
  }

  set x(val=0) {
    this._x = val;
  }

  /**
   * @example
   *
   * let p = new Point(0.5, 0.5);
   * console.log(p.y);
   * p.y = 0.2;
   * console.log(p.y);
   *
   */
  get y() {
    return this._y;
  }

  set y(val=0) {
    this._y = val;
  }

  /**
   * @param {Point} p - The point you want to know the distance to
   *
   * @returns {Number} The distance between this point and the one given.
   */
  distance(p) {
    const dx = p.x - this.x;
    const dy = p.y - this.y;

    return Math.sqrt((dx * dx) + (dy * dy));
  }

  /**
   * @param {Point} p - The point you want to know the angle to.
   *
   * @returns {Number} The angle in radians to the point.
   */
  angle_to(p) {
    // assume this point is the centre, and p is on a cicle perimeter
    // thus we can use the arc tangent of (p - this) to get the angle
    return Math.atan2(p.y - this.y, p.x - this.x);
  }
}

/**
 * Point vector is a point that also has an angle and magnitude
 *
 * @extends Point
 *
 * @property {Number} x - The X position of the Point
 * @property {Number} y - The Y position of the Point
 * @property {Number} angle - The angle of the vector in radians.
 * @property {Number} length - The size of the vector.
 *
 */
export class PointVector extends Point {
  /**
   * Create the point vector
   *
   * @param {Number=} x - x position for the point
   * @param {Number=} y - y position for the point
   * @param {Number=} angle - angle for the vector in radians
   * @param {Number=} length - size of the vector
   *
   */
  constructor(x=0, y=0, angle=0, length=0) {
    super(x, y);

    this._angle = angle;
    this._length = length;
  }

  /**
   * @example
   *
   * let p = new PointVector(0.5, 0.5, 2.5, 0.9);
   * console.log(p.angle);
   * p.angle = Math.PI;
   * console.log(p.angle);
   *
   */
  get angle() {
    return this._angle;
  }

  set angle(v) {
    this._angle = v;
  }

  /**
   * @example
   *
   * let p = new PointVector(0.5, 0.5, 2.5, 0.9);
   * console.log(p.length);
   * p.length = 1.3;
   * console.log(p.length);
   *
   */
  get length() {
    return this._length;
  }

  set length(v) {
    this._length = v;
  }

  /**
   * Get the end point for this vector
   *
   * @returns {Point} the {@link Point} at the end of the vector
   */
  end_point() {
    return new Point(
      this._x + (this._length * Math.cos(this._angle)),
      this._y + (this._length * Math.sin(this._angle))
    );
  }
}
