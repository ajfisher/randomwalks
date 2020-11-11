import _ from 'lodash';
const { minBy, maxBy } = _;

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';
import { Rectangle } from './actions/index.js';

import { Rect } from './primatives/Shape.js';
import { RectMask } from './masks/RectMask.js';

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
   *
   */
  constructor(options={}) {
    super(options);

    this.rect = options.rect || null; // TODO add a test here
    this.dot_width = options.dot_width || 0.001;
    this.line_width = options.line_width || 0.001;
    this.fill_angle = options.fill_angle || 0.02 * TAU;
    this.fill_density = options.fill_density || 0.01;
    this.mask = options.mask || null;
  }

  /**
   * Draw the rectangle to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, line_width, fill_angle, fill_density, dot_width, rect } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.lineWidth = line_width * width;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = hsvts(colour);
    ctx.strokeStyle = hsvts(colour);

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

    console.log(width, height);

    const no_rects = choose([3, 4, 5]);
    const gap = 0.04; // gap between frames.
    const frame_line_width = 0.001;
    const frame_width = ((1 - (2 * this.border) - ((no_rects -1) * gap)) / (no_rects));
    const frame_height = 1 - 2 * this.border;

    const rects = [];
    const start_x = this.border;
    const start_y = this.border;

    // density levels
    const start_d = rnd_range(0.1, 0.3);
    const end_d = rnd_range(start_d, 0.6);

    for (let r = 0; r < no_rects; r++) {
      rects.push(new Rect(
        start_x + (r * frame_width) + (r * gap),
        start_y,
        frame_width,
        frame_height
      ));
    }

    for (let r = 0; r < rects.length; r++) {
      this.enqueue(new NoiseFill({
        alpha: 1,
        width, height,
        line_width: 0.001,
        dot_width: 0.001,
        fill_density: start_d + ((end_d - start_d / rects.length) * r),
        mask: new RectMask({width, height, rect: rects[r]}),
        rect: rects[r],
        t: r
      }), opts.fg);
    }

    // draw the frames
    for (let r = 0; r < rects.length; r++) {
      this.enqueue(new Rectangle({
        alpha: 1,
        width, height,
        line_width: frame_line_width,
        rect: rects[r],
        fill: false
      }), opts.fg);
    }

    super.execute(opts);
  }
}

