import { Point } from './Point.js';
import { Triangle } from './Triangle.js';

import { TAU } from '../utils/geometry.js';
import { rnd_range } from '../utils/random.js';

/**
 * Circle primative. Comprises a point and radius
 * @class
 * @category Primitives
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
  constructor(options={x:0.5, y:0.5, r: 0.4}) {
    /**
     * The X coordinate of the circle centre
     * @type {Number}
     */
    this.x = options.x;
    /**
     * The Y coordinate of the circle centre
     * @type {Number}
     */
    this.y = options.y;
    /**
     * The radius of the circle
     * @type {Number}
     */
    this.r = options.r;
  }

  /**
   * Given an angle around the circle provide the {@link Point} on the
   * Circle's permiter at that angle
   *
   * @param {Number} angle - the angle from the origin for the point
   *
   * @returns {Point} The {@link Point} at the given angle around the circle perimeter
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
   * The length of the perimeter of the circle
   * @type {Number}
   * @readonly
   */
  get perimeter() {
    return 2 * Math.PI * this.r;
  }

  /**
   * Generates a random triangle whose points are circumscribed by this circle.
   *
   * @returns {Triangle} A random {@link Triangle} from this circle
   */
  random_triangle() {
    const pts = [];
    for (let v=0; v < 3; v++) {
      pts.push(this.point_at(rnd_range(-TAU, TAU)));
    }

    return new Triangle(pts);
  }
}
