import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';
import { Polygon } from './actions/index.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';
import { chaikin, convex, TAU } from './utils/geometry.js';

/**
 * Create a chaikin-relaxed polygon into a starburst style.
 *
 */

export default class ChaikinBursts extends Drawable {
  /**
   * Constructs the ChaikinBursts Drawable
   * @param {Object} options - the options for this drawable
   *
   */
  constructor(options={}) {
    const opts = options;
    opts.name = 'chaikinbursts';
    opts.border = 0.04;
    super(opts);
  }

  /**
   * draws the ChaikinBurst to the screen
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

    const alpha = 0.5;
    const dot_size = 0.01;
    const line_width = 0.005;

    const points = []; // hold the points for all the polygons
    const no_polys = 1;
    const no_points = 11;
    const no_relaxations = 3;

    // create the relaxed polygons.
    for (let poly = 0; poly < no_polys; poly++) {
      points[poly] = [];
      // choose some random points to add to the polygon
      for (let p = 0; p < no_points; p++) {
        points[poly].push({
          x: rnd_range(0.2, 0.8),
          y: rnd_range(0.2, 0.8)
        });
      }
      // now order the points into a convex hull
      points[poly] = convex(points[poly]);

      // relax the control polygon using Chaikin Curve algorithm
      for (let c = 0; c < no_relaxations; c++) {
        points[poly] = chaikin(points[poly]);
      }
    }

    // now draw this iteration
    this.enqueue(new Polygon({
      alpha,
      width, height,
      points: points[0],
      dot_size,
      line_width,
      style: 'BOTH',
      t: 0
    }), opts.fg);

    super.execute(opts);
  }
}
