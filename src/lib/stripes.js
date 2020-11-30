import SimplexNoise from 'simplex-noise';

import { Drawable } from './drawable.js';

import { Actionable } from './actions/index.js';
import { DrawDot, DrawLineList } from './actions/Basics.js';

import { Circle, Line, Point } from './primatives/Shape.js';

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

    const line_width = 0.0001;
    const mv = 0.1;
    const scale = 10; // make this 1 or 0.1 and it's very calm. 10 is cool, 100+ is frantic
    const alpha = 0.35;

    const simplex = new SimplexNoise();

    // subdivide the stage into a series of strips, each one a width governed
    // by a prime so that way they don't factor into each other.
    const primes = [19, 23, 29, 31, 37, 41, 43, 47, 51, 53, 57, 59, 61, 67, 71, 73, 79, 83];
    // took a few of the fibs out to purposefully drive density and sparsity
    const fibs = [0, 3, 5, 13, 21, 34, 55, 233, 377, 610, 987, 1597];

    const x_vals = [this.border + line_width];
    const width_left = 1.0;
    let curr_x = x_vals[0];
    while (curr_x < (1 - this.border)) {
      // choose a prime, use it as a fraction and then add a point.
      const w = 1 / choose(primes);
      curr_x = curr_x + w;
      x_vals.push(curr_x);
    }
    // now add last value as the outer edge
    x_vals.push(1 - this.border - line_width);

    // make a bunch of lines across the screen
    const vert_lines = [];
    for (let xv = 0; xv < x_vals.length - 1; xv++) {
      const x = x_vals[xv];
      const w = (x_vals[xv+1] - x);
      const vp1 = new Point(x, 0);
      const vp2 = new Point(x, 1);
      vert_lines.push(new Line(vp1, vp2));

      // for each horizontal rectangle, subdivide this down with a smaller
      // one so we can make smaller entities
      const no_lines = choose(fibs);
      const gap = (1 - 2 * this.border - 2 * line_width) / no_lines;
      let curr_y = this.border + line_width;

      const linelist = [];
      for (let l = 0; l <= no_lines; l++) {
        const x1 = x;
        const x2 = x + w;

        // jitter the y points of the line a bit
        const dy1 = simplex.noise2D(x1 * scale, curr_y * scale) * mv;
        const dy2 = simplex.noise2D(x2 * scale, curr_y * scale) * mv;

        const y1 = curr_y + dy1;
        const y2 = curr_y + dy2;

        const p1 = new Point(x1, y1);
        const p2 = new Point(x2, y2);

        linelist.push(new Line(p1, p2));

        // move the y position along by the height of the gap
        curr_y = curr_y + gap;
      }

      // queue up the current list.
      this.enqueue(new DrawLineList({
        alpha,
        height, width,
        lines: linelist,
        line_width: 0.001
      }), opts.fg);
    }

    // add the last vert line ont he right hand side
    const vp1 = new Point(x_vals[x_vals.length-1], 0);
    const vp2 = new Point(x_vals[x_vals.length-1], 1);
    vert_lines.push(new Line(vp1, vp2));

    this.enqueue(new DrawLineList({
      alpha,
      height, width,
      lines: vert_lines,
      line_width: 0.001
    }), opts.fg);

    super.execute(opts);
  }
}

// Explicitly export this for import later.
export default Stripe;
