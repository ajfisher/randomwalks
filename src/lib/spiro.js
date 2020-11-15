import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable.js';
import Drawable from './drawable.js';

import { Circle } from './primatives/Circle.js';
import { Point } from './primatives/Point.js';

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
   * @param {Noise} options.noise - a noise object to use for this drawing
   *
   */
  constructor(options={}) {
    super(options);

    this.dot_width = options.dot_width || 0.001;
    this.mask = options.mask || null;
    this.circle = options.circle || null;
    this.noise = options.noise || null;
    this.mv = this.circle.r * 0.2 || 0.05;
    this.line_rotation = options.line_rotation || 0;
  }

  /**
   * Draw the Spiro Circle to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, circle, dot_width, noise, mv, t, line_rotation } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    const gap = 4;
    const no_steps = Math.round(circle.perimeter / (gap * dot_width));
    const step_angle = TAU / no_steps;
    const start_angle = 0.01; // rnd_range(0.0001, TAU);

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    ctx.lineWidth = dot_width * width;

    // walk around the circle and draw dots at the point on the perimeter
    for (let s = 0; s < no_steps; s++) {
      const angle = s * step_angle;
      const pt = circle.point_at(start_angle + angle);

      // make the base line length 20% of the radius length.
      let line_length = 0.3 * circle.r;
      let a = angle;
      if (a > Math.PI) {
        a = Math.PI - (angle - Math.PI);
      }
      const line_noise = noise.noise2D(a, t);
      line_length = line_length + (line_noise * mv);

      // determine an amount to offset the line from the centre point.
      const offset_noise = noise.noise2D(s, t);

      const x1 = 0.5 * offset_noise * line_length;
      const x2 = (0.5 * offset_noise + 1) * line_length;
      const x3 = x2 + (rnd_range(0.1, 0.3) * line_length);
      const x4 = x3 + (rnd_range(0.1, 0.3) * line_length);
      const x5 = x4 + (rnd_range(0.05, 0.2) * line_length);
      const x6 = x5 + (rnd_range(0.05, 0.2) * line_length);
      const x7 = x6 + (rnd_range(0.02, 0.05) * line_length);
      const x8 = x7 + (rnd_range(0.01, 0.02) * line_length);

      ctx.save();
      // move to the point on the circle then rotate so x axis is now
      // on the line circle.centre -> point.
      ctx.translate(pt.x * width, pt.y * width);
      ctx.rotate(start_angle + angle + line_rotation);

      ctx.beginPath();
      ctx.moveTo(x1 * width, 0);
      ctx.lineTo(x2 * width, 0);

      ctx.moveTo(x3 * width, 0);
      ctx.lineTo(x4 * width, 0);
      ctx.stroke();

      ctx.moveTo(x5 * width, 0);
      ctx.lineTo(x6 * width, 0);
      ctx.stroke();

      ctx.moveTo(x7 * width, 0);
      ctx.lineTo(x8 * width, 0);
      ctx.stroke();

      ctx.restore();
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

    const no_circles = 1;
    const simplex = new SimplexNoise();

    for (let c = 0; c < no_circles; c++) {
      const no_passes = rnd_range(2, 5);
      const dot_width = 0.0015;
      const radius = rnd_range(0.1, 0.25);
      const line_rotation = rnd_range(-0.25 * TAU, 0.25 * TAU);

      // make a bit of jitter for the radius
      const jitter = 0; // simplex.noise2D(p/no_passes, 0.001) * 0.05;
      const centre = new Point(
        choose([0.33, 0.5, 0.67]),
        choose([0.33, 0.5, 0.67])
      );
      const circle = new Circle({ x: centre.x, y: centre.y, r: radius + jitter });

      for (let p = 0; p < no_passes; p++) {
        this.enqueue(new SpiroCircle({
          alpha: 0.7,
          width, height,
          circle,
          dot_width,
          noise: simplex,
          line_rotation,
          mv: rnd_range(0.4, 0.8),
          t: (p + 1) / no_passes
        }), opts.fgs[(c+1) % (opts.fgs.length - 1)]);
      }
    }

    super.execute(opts);
  }
}
