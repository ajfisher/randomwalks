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
}
