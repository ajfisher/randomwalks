import { Point } from './Point.js';

/**
 * A rectable that comprises a point and it's width and height
 *
 * @extends Point
 *
 */
export class Rect extends Point {
  /**
   * Create the rectangle.
   *
   * @constructor
   * @param {Number=} x - X position of the top left point of the rectangle
   * @param {Number=} y - Y position of the top left point of the rectangle
   * @param {Number} w - Width of the rectangle
   * @param {Number} h - Height of the rectangle
   *
   * @example
   *
   *  new Rect(0.5, 0.5, 0.2, 0.3)
   *
   */
  constructor(x=0, y=0, w, h) {
    super(x, y);

    this._w = w;
    this._h = h;
  }

  /**
   * @type {number}
   *
   * @example
   *
   * let r = new Rect(0, 0, 0.2, 0.1);
   * console.log(p.width);
   * r.width = 0.2;
   * console.log(r.width);
   *
   */
  get width() {
    return this._w;
  }

  set width(val=0) {
    this._w = val;
  }

  /**
   * @type {number}
   *
   */
  get w() {
    return this._w;
  }

  set w(val=0) {
    this.width = val;
  }

  /**
   * @type {number}
   *
   * @example
   *
   * let r = new Rect(0, 0, 0.2, 0.1);
   * console.log(p.height);
   * r.height = 0.5;
   * console.log(r.height);
   *
   */
  get height() {
    return this._h;
  }

  set height(val=0) {
    this._h = val;
  }

  /**
   * @type {number}
   *
   */
  get h() {
    return this._h;
  }

  set h(val=0) {
    this.height = val;
  }

  /**
   * @type {Point[]}
   *
   * @example
   *
   * let r = new Rect(0, 0, 0.2, 0.1);
   * console.log(p.points);
   *
   */
  get points() {
    // get the pooints and send back in CCW order
    const pts = [];

    return [
      new Point(this._x, this._y),
      new Point(this._x, this._y + this._h),
      new Point(this._x + this._w, this._y + this._h),
      new Point(this._x + this._w, this._y)
    ];
  }
}
