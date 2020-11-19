import Actionable from './actions/actionable.js';
import Drawable from './drawable.js';

import { DrawDot, DrawArc } from './actions/Basics.js';
import { Circle, Point, PointVector, Triangle } from './primatives/Shape.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast, EGGSHELL } from './utils/draw.js';
import { rescale } from './utils/maths.js';
import { TAU } from './utils/geometry.js';

/**
 * A basic scaffolding that is used to try things out.
 * @extends Drawable
 *
 */
export default class Simple extends Drawable {
  /**
   * Constructs the TriangleFall Drawable
   * @param {Object} options - the options for this drawable
   *
   */
  constructor(options={}) {
    const opts = options;
    opts.name = 'simple';
    opts.border = 0.01;
    super(opts);
  }

  /**
   * Sets up the Triangle Fall to be drawn to the screen
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

    opts.bg = EGGSHELL;
    opts.fg = fgs[0];
    opts.fgs = fgs;

    const arc_fg = (fgs[0][2] > 50 ? [0,0,0] : [0, 0, 100]);

    // get the basic dimensions of what we need to draw
    const width = this.w(); // - 2 * this.border;
    const height = this.h(); // - 2 * this.border;

    const primes = [5, 7, 9, 11, 13, 17, 19, 23];
    const line_width = 0.006;
    const c = new Circle({x: 0.5, y: 0.5, r: 0.35});
    const ring_gap = 2 * line_width;
    const rings = c.r / ring_gap; // how many rings do we need to do

    this.enqueue(new DrawDot({
      alpha: 0.5,
      width, height,
      dot: c,
      r: c.r,
      t: 1
    }), bg);


    for (let ring = 0; ring < rings; ring++) {
      // draw an arbitrary ring
      const tmp_circle = new Circle({x: c.x, y: c.y,
        r: (0.5 * line_width) + (ring * ring_gap)
      });

      // draw the "gap" arc
      this.enqueue(new DrawArc({
        alpha: 0.2,
        width, height,
        line_width: line_width / 2,
        circle: tmp_circle,
        start: 0,
        end: TAU,
        t: ring
      }), opts.fgs[2]);

      const ring_arc_prime = choose(primes);
      const gap_arc_prime = choose(primes);
      // walk around the circle and draw arcs on this ring until you do a full
      // turn around.
      let angle_count = 0;
      let start_angle = rnd_range(0.000001, TAU);
      let end_angle = 0;
      while (angle_count < TAU) {
        const arc_amt = rnd_range(0.1, TAU / ring_arc_prime);
        end_angle = start_angle + arc_amt;

        // draw the arc
        this.enqueue(new DrawArc({
          alpha: 1,
          width, height,
          line_width,
          line_cap: 'round',
          circle: tmp_circle,
          start: start_angle,
          end: end_angle,
          t: ring
        }), opts.fg);

        angle_count = angle_count + arc_amt;

        // now, make a gap before and then update start position accordingly.
        const gap_amt = rnd_range(0.1, TAU / gap_arc_prime);
        start_angle = start_angle + arc_amt + gap_amt;
        angle_count = angle_count + gap_amt;
      }
    }

    super.execute(opts);
  }
}
