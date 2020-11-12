import { PointVector } from '../primatives/Point.js';

/**
 * A 2D field of {@link PointVector}s
 *
 */
export class PointField {
  /**
   * Create the PointField
   * @constructor
   *
   * @param {Object} options - The options object for the PointField
   * @param {Number} options.cols - Number of columns in the 2D field
   * @param {Number} options.rows - Number of rows in the 2D field
   * @param {Number} options.width - width of the field to cover
   * @param {Number} options.height - height of the field to cover
   *
   */
  constructor(options={}) {
    /**
     * @private
     */
    this._points = [];
    this._cols = parseInt(options.cols, 10);
    this._rows = parseInt(options.rows, 10);
    this._width = options.width;
    this._height = options.height;

    const cell_width = this._width / this._cols;
    const cell_height = this._height / this._rows;

    for (let r = 0; r < this._rows; r++) {
      const row = [];
      for (let c = 0; c < this._cols; c++) {
        // create a new PointVector with x and y set but rotation and size 0.
        row.push(new PointVector(c * cell_width, r * cell_height, 0, 0));
      }
      this._points.push(row);
    }
  }

  /**
   * @property {PointVector[]} points - 2D array of {@link PointVector}s row column order
   */
  get points() {
    return this._points;
  }

  /**
   * @property {Number} cols - number of columns in the point field
   */
  get cols() {
    return this._cols;
  }

  /**
   * @property {Number} rows - number of rows in the point field
   */
  get rows() {
    return this._rows;
  }
}
