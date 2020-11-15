import { Point } from './Point.js';

/**
 * Circle primative. Comprises a point and radius
 *
 */

export class Circle {
  /**
   * Create a new circle
   *
   * @param {Object} options - an options object to create the circle
   * @param {Number} options.x - the x point of the centre of the circle
   * @param {Number} options.y - the y point of the centre of the circle
   * @param {Number} options.r - the radius of the circle
   *
   */
  constructor(options={}) {
    /**
     * @type {Number} x - the x point of the centre
     * @public
     */
    this.x = options.x || 0.5;

    /**
     * @type {Number} y - the y point of the centre
     * @public
     */
    this.y = options.y || 0.5;

    /**
     * @type {Number} r - the radius of the Circle
     * @public
     */
    this.r = options.r || 0.4;
  }

  /**
   * Given an angle around the circle provide the {@link Point} on the
   * Circle's permiter at that angle
   *
   * @param {Number} angle - the angle from the origin for the point
   *
   * @returns {Point} - a {@link Point} at that angle around the circle perimeter
   *
   */
  point_at(angle=0) {
    // Calculate the position using the angle and the radius of the circle
    const { r } = this;

    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);

    return new Point(this.x + x, this.y + y);
  }

  /**
   * @type {Number} perimeter - the perimeter length of the circle
   * @public
   */
  get perimeter() {
    return 2 * Math.PI * this.r;
  }
}
