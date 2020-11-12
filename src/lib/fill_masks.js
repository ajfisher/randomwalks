import _ from 'lodash';
const { minBy, maxBy } = _;

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';
import { Rectangle } from './actions/index.js';

import { Rect } from './primatives/Shape.js';
import { RectMask } from './masks/RectMask.js';
import { PointField } from './fields/PointField.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';
import { TAU } from './utils/geometry.js';

/**
 * Draw the rectangle and put some fill into it.
 *
 * @extends Actionable
 *
 */
class NoiseFill extends Actionable {
  /**
   * Create the actionable
   *
   * @param {Object=} options - the various options for this drawing
   * @param {Mask=} options.mask - a mask to apply to this drawing
   * @param {PointField} options.point_field - A {@link PointField} to draw with
   * @param {Number} options.top - The Y position to start from
   * @param {Number} options.left - the X position to start from
   * @param {Numner} options.threshold - value -1..1 to determine size cutoff
   *
   */
  constructor(options={}) {
    super(options);

    this.left = options.left || 0;
    this.top = options.top || 0;
    this.dot_width = options.dot_width || 0.001;
    this.mask = options.mask || null;
    this.point_field = options.point_field || null;
    this.threshold = options.threshold || 0;
  }

  /**
   * Draw the Noise Fill to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, point_field, dot_width, top, left, threshold } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = hsvts(colour);

    // now we walk along the point field and draw to the screen accoridngly
    const offset_x = point_field._width / point_field.cols * 0.5;
    const offset_y = point_field._height / point_field.rows * 0.5;

    for (let r = 0; r < point_field.rows; r++) {
      for (let c = 0; c < point_field.cols; c++) {
        // get the PointVector
        const {x, y, length} = point_field.points[r][c];
        ctx.beginPath();

        ctx.moveTo((left + offset_x + x) * width, (top + offset_y + y) * height);
        let ds = dot_width;
        if (length > threshold) {
          ds = 1.5 * dot_width;
        }

        ctx.arc((left + offset_x + x) * width, (top + offset_y + y) * height, ds * width, 0, TAU);
        ctx.fill();
      }
    }

    /**
    // now we walk along x and do a fill according to the fill amount
    const no_cols = rect.width / (2*dot_width) * fill_density;
    const no_rows = rect.height / (2*dot_width) * fill_density;
    const x_dist = rect.width / no_cols;
    const y_dist = rect.height / no_rows;

    for (let c = 0; c < no_cols; c++) {
      const x = rect.x + (x_dist * c);
      for (let r = 0; r < no_rows; r++) {
        const y = rect.y + (y_dist * r);

        const dx = x + rnd_range(-0.5 * x_dist, 0.5 * x_dist);
        const dy = y + rnd_range(-0.5 * y_dist, 0.5 * y_dist);

        ctx.beginPath();
        ctx.moveTo(dx * width , dy * height);
        ctx.arc(dx * width, dy * height, dot_width * width, 0, TAU);
        ctx.fill();
      }
    }
    **/

    // restore initial save
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }
  }
}

/**
 * Break up the canvas into multiple strips and then fill them with varying
 * levels of noise. Then draw something over the top of this.
 *
 * @extends Drawable
 *
 */
export default class NoiseFills extends Drawable {
  /**
   * Constructs the NoiseFills Drawable
   * @param {Object} options - the options for this drawable
   *
   */
  constructor(options={}) {
    const opts = options;
    opts.name = 'noisefills';
    opts.border = 0.04;
    super(opts);
  }

  /**
   * Sets up the NoiseFill to be drawn to the screen
   *
   * @param {number} seed - random seed to be used for this design
   * @param {DrawOptions} options - the {@link DrawOptions} for this drawing
   *
   */
  draw(seed, options) {
    // get or create the seed
    this.seed = parseInt(seed, 10) || null;
    const opts = options || {};

    // prep the object with all the base conditions
    super.init(opts);

    // add the specific drawing actions now
    const palette = this.palette;

    const { bg, fgs } = rank_contrast(palette);

    opts.bg = bg; // [47, 6, 100];
    opts.fg = fgs[0];
    opts.fgs = fgs;

    // get the basic dimensions of what we need to draw
    const width = this.w() - 2 * this.border;
    const height = this.h() - 2 * this.border;

    const no_rects = 3; // choose([3, 4, 5]);
    const gap = 0.04; // gap between frames.
    const frame_line_width = 0.001;
    const frame_width = ((1 - (2 * this.border) - ((no_rects -1) * gap)) / (no_rects));
    const frame_height = 1 - 2 * this.border;

    const rects = [];
    const fields = [];
    const start_x = this.border;
    const start_y = this.border;

    const dot_width = 0.0015;
    const density = 1 / rnd_range(0.1, 0.15);
    const threshold = rnd_range(-0.5, 0.5);

    for (let r = 0; r < no_rects; r++) {
      rects.push(new Rect(
        start_x + (r * frame_width) + (r * gap),
        start_y,
        frame_width,
        frame_height
      ));

      const f = new PointField({
        cols: frame_width / (density * dot_width),
        rows: frame_height / (density * dot_width),
        width: frame_width,
        height: frame_height
      });

      const simplex = new SimplexNoise();

      // walk the point field and add a noise map to it.
      for (let row = 0; row < f.rows; row++) {
        for (let col = 0; col < f.cols; col++) {
          const {x, y} = f.points[row][col];
          f.points[row][col].length = simplex.noise2D(x, y);
        }
      }

      fields.push(f);
    }

    for (let r = 0; r < rects.length; r++) {
      this.enqueue(new NoiseFill({
        alpha: 0.8,
        width, height,
        left: rects[r].x,
        top: rects[r].y,
        dot_width,
        threshold,
        point_field: fields[r],
        mask: new RectMask({width, height, rect: rects[r]}),
        t: r
      }), opts.fg);
    }

    // draw the frames
    for (let r = 0; r < rects.length; r++) {
      this.enqueue(new Rectangle({
        alpha: 0.3,
        width, height,
        line_width: frame_line_width,
        rect: rects[r],
        fill: false
      }), opts.fg);
    }

    super.execute(opts);
  }
}

