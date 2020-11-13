import Actionable from './actions/actionable.js';
import Drawable from './drawable.js';

import { Circle } from './primatives/Circle.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';
import { TAU } from './utils/geometry.js';

/**
 * Draw the circle decomposed by lines
 *
 * @extends Actionable
 *
 */
class SpiroCircle extends Actionable {
  /**
   * Create the actionable
   *
   * @param {Object=} options - the various options for this drawing
   * @param {Mask=} options.mask - a mask to apply to this drawing
   * @param {Circle} options.circle - A {@link Circle} to draw with
   *
   */
  constructor(options={}) {
    super(options);

    this.dot_width = options.dot_width || 0.001;
    this.mask = options.mask || null;
    this.circle = options.circle || null;
  }

  /**
   * Draw the Spiro Circle to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, circle, dot_width } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);

    ctx.lineWidth = dot_width * width;

    ctx.beginPath();
    // ctx.moveTo(circle.x * width, circle.y * height);
    ctx.arc(circle.x * width, circle.y * height, circle.r * width, 0, TAU);
    ctx.stroke();

    // restore initial save
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }
  }
}
/**
 * Draw a circular arc on the canvas which is decomposed using a series of
 * lines.
 * @extends Drawable
 *
 */
export default class Spiro extends Drawable {
  /**
   * Constructs the Spiro Drawable
   * @param {Object} options - the options for this drawable
   *
   */
  constructor(options={}) {
    const opts = options;
    opts.name = 'spiro';
    opts.border = 0.04;
    super(opts);
  }

  /**
   * Sets up the Spiro to be drawn to the screen
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

    const dot_width = 0.0015;

    const circle = new Circle({ x: 0.5, y: 0.5, r: 0.2 });
    // const simplex = new SimplexNoise();

    this.enqueue(new SpiroCircle({
      alpha: 1,
      width, height,
      circle,
      dot_width,
      t: 1
    }), opts.fg);

    super.execute(opts);
  }
}
