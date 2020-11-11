/**
 * Defines a Point to be used in the system using local coordinate values
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
   *
   * @property {number} x - The x position of the point.
   *
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
   * @property {number} y - The y position of the point.
   *
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
}

/**
 * Point vector is a point that also has an angle and magnitude
 *
 * @extends Point
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
   * @type {number}
   *
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
   * @type {number}
   *
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
}
