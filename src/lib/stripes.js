import { Drawable } from './drawable.js';

import { Actionable } from './actions/index.js';
import { DrawDot, DrawRect, DrawRectList } from './actions/Basics.js';
import { ApplyGrain } from './concentrics.js';

import { Circle, Rect } from './primatives/Shape.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';
import { chaikin, convex, TAU } from './utils/geometry.js';

/**
 * Draw a set of stripes of differing colours and fills to the screen
 *
 * @category Drawable
 *
 */
export class Stripe extends Drawable {
  /**
   * Constructs the ChaikinBursts Drawable
   * @param {DrawOptions} options - the options for this drawable
   *
   */
  constructor(options={}) {
    options.name = 'stripes';
    options.border = 0.02;
    super(options);
  }

  /**
   * sets up the Stipe drawing to be made and adds actions to the queue
   *
   * @param {number} seed - random seed to be used for this design
   * @param {Object} options - the options for drawing
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
    const width = this.w(); // - 2 * border;
    const height = this.h(); // - 2 * border;

    const c = new Circle({
      x: choose([0.37, 0.5, 0.63]),
      y: choose([0.37, 0.5, 0.63]),
      r: rnd_range(0.15, 0.2)
    });

    this.enqueue(new DrawDot({
      alpha: 0.15,
      height, width,
      dot: c,
      r: c.r
    }), opts.fg);

    // subdivide the stage into a series of strips, each one a width governed
    // by a prime so that way they don't factor into each other.
    const primes = [19, 23, 29, 31, 37, 41, 43, 47, 51, 53, 57, 59, 61, 67, 71, 73, 79, 83, 89 ];

    const x_vals = [0];
    const width_left = 1.0;
    let curr_x = 0;
    while (curr_x < 1) {
      // choose a prime, use it as a fraction and then add a point.
      const w = 1 / choose(primes);
      curr_x = curr_x + w;
      x_vals.push(curr_x);
    }

    // make a bunch of rectangles across the screen
    const fg_exbg = opts.fgs.slice(0, -1); // piff the bg colour off fg list.
    // let curr_colour = choose(fg_exbg);

    for (let xv = 0; xv < x_vals.length - 1; xv++) {
      const x = x_vals[xv];
      const w = (x_vals[xv+1] - x);

      // for each horizontal rectangle, subdivide this down with a smaller
      // one so we can make smaller entities
      let curr_y = 0;

      // set up the base colour for this strip
      const base_colour = [...(choose(fg_exbg))];
      const rectlist = [];
      while (curr_y < 1) {
        const h = 1 / choose(primes);
        const rect = new Rect(x, curr_y, w, h);

        // modify the brightness value of the base colour for this rect
        const r_colour = [...base_colour];
        r_colour[2] = r_colour[2] + rnd_range(-10, 10);

        rect.alpha = rnd_range(0.2, 0.4);
        rect.colour = [...r_colour];

        rectlist.push(rect);

        // move the y position along by the height of the rect we just made
        curr_y = curr_y + h;
      }

      // queue up the current list.
      this.enqueue(new DrawRectList({
        height, width,
        rects: rectlist,
        line_width: 0,
        fill: true
      }), null);
    }

    this.enqueue(new ApplyGrain({
      alpha: 0.2,
      width, height,
      no: 1500,
      min: 0.003,
      max: 0.006
    }), opts.bg);
    super.execute(opts);
  }
}

// Explicitly export this for import later.
export default Stripe;
