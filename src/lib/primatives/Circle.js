/**
 * Circle primative. Comprises a point and radius
 *
 */

export class Circle {
  /**
   * Create a new circle
   *
   */

  constructor(options={}) {
    this.x = options.x || 0.5;
    this.y = options.y || 0.5;
    this.r = options.r || 0.4;
  }
}
