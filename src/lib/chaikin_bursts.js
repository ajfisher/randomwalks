import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';
import { Polygon } from './actions/index.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';
import { chaikin, convex, TAU } from './utils/geometry.js';

/**
 * Draw sandline style lines around a polygon
 *
 */

class PolySandline extends Actionable {
  /**
   * Create the PolySandline actionable
   *
   * @param {Object=} options - Options object to setup the action
   * @param {number} options.line_width - Width of line to draw as %
   * @param {number} options.dot_size - Width of line to draw as %
   * @param {Object[]} options.points - Array of {@link Point} objects
   *
   */
  constructor(options={}) {
    const opts = options;
    super(opts);

    this.line_width = opts.line_width || 0.01;
    this.dot_size = opts.dot_size || 0.01;
    this.points = opts.points || [];
    this.mv = opts.mv || 0.02;
    this.fill = opts.fill || 0.5;
    this.scale = opts.scale || 1.0;
    this.simplex = opts.simplex;
  }

  /**
   * Draw the Sandline to the context
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, points, dot_size, line_width, simplex, scale: s } = this;

    super.draw(ctx);

    ctx.save();
    ctx.lineWidth = line_width * width;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = hsvts(colour);
    ctx.strokeStyle = hsvts(colour);

    // walk the points around the polygon
    // then iterate between them to then draw the sandlines.
    for (let p = 0; p < points.length; p++) {
      // special case of p == 0, previous point is the last one in the array
      const p1 = (p == 0) ? points[points.length - 1] : points[p - 1];
      const p2 = points[p];

      const p1x_noise = simplex.noise2D(p1.x * s, this.t * s);
      const p1y_noise = simplex.noise2D(p1.y * s, this.t * s);
      const p2x_noise = simplex.noise2D(p2.x * s, this.t * s);
      const p2y_noise = simplex.noise2D(p2.y * s, this.t * s);

      p1.x = p1.x + (p1x_noise * this.mv);
      p1.y = p1.y + (p1y_noise * this.mv);

      p2.x = p2.x + (p2x_noise * this.mv);
      p2.y = p2.y + (p2y_noise * this.mv);

      // get the differences between the two points.
      const pdx = p2.x - p1.x;
      const pdy = p2.y - p1.y;

      const p1p2_dist = Math.sqrt(pdx * pdx + pdy * pdy);
      const no_dots = p1p2_dist / this.dot_size * this.fill;

      // draw random dots over the segment
      for (let d = 0; d < no_dots; d++) {
        const u = Math.random();
        const dx = p1.x + u * pdx;
        const dy = p1.y + u * pdy;

        ctx.beginPath();
        ctx.moveTo(dx * width, dy * height);
        ctx.arc(dx * width, dy * height, dot_size * width, 0, TAU);
        ctx.fill();
      }
    }

    // restore original transform
    ctx.restore();
  }
}
/**
 * Draw the starburst style lines around a polygon
 *
 */

class Burst extends Actionable {
  /**
   * Create the Burst actionable
   *
   * @param {Object=} options - Options object to setup the action
   * @param {number} options.line_width - Width of line to draw as %
   * @param {Object[]} options.points - Array of {@link Point} objects
   * @param {Colour[]} options.colours - Arrat of {@link Colour} objects
   *
   */
  constructor(options={}) {
    const opts = options;
    super(opts);

    this.line_width = opts.line_width || 0.01;
    this.dot_size = opts.dot_size || 0.01;
    this.points = opts.points || [];

    this.line_length = opts.line_length || 0.1;
  }

  /**
   * Draw the burst to the context
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, points, line_width, line_length } = this;

    super.draw(ctx);

    ctx.save();
    ctx.lineWidth = line_width * width;
    ctx.globalAlpha = 0.1; // this.alpha;
    ctx.fillStyle = hsvts(colour);

    // walk the points around the polygon
    // At each point, work out the arc tangent to find the normal
    // then create a line outwards from current point by x amount.
    for (let p = 0; p < points.length; p++) {
      const p2 = points[p];
      // special case of p == 0, previous point is the last one in the array
      const p1 = (p == 0) ? points[points.length - 1] : points[p - 1];

      // get the arc tangent between the points.
      const pdx = p2.x - p1.x;
      const pdy = p2.y - p1.y;
      const r = Math.atan2(pdx, pdy);

      // for now let's just draw a dot at each point
      ctx.strokeStyle = hsvts(colour);
      ctx.globalAlpha = 0.1 + (p * 0.05);
      ctx.beginPath();
      ctx.moveTo(p2.x * width, p2.y * height);
      ctx.arc(p2.x * width, p2.y * height, line_width * width, 0, TAU);
      ctx.fill();

      // draw a line from p2 to p1
      ctx.strokeStyle = hsvts([30, 100, 100]);
      ctx.beginPath();
      ctx.moveTo(p2.x * width, p2.y * height);
      ctx.lineTo(p1.x * width, p1.y * height);
      ctx.stroke();

      // move to P2, rotate by atan2 and draw a line to the right X
      ctx.save();
      ctx.translate(p2.x * width, p2.y * height);
      ctx.rotate(r);
      ctx.strokeStyle = hsvts([90, 100, 100]);
      ctx.moveTo(0,0);
      ctx.lineTo(0, 0.1*width);
      ctx.stroke();
      ctx.restore();
      // now translate to the point specifically
      /** ctx.save();
      ctx.translate(p2.x * width, p2.y * height);
      ctx.rotate(r);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0.1 * width, 0);
      ctx.stroke();

      ctx.restore(); */
    }

    // restore original transform
    ctx.restore();
  }
}


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

    this.simplex = new SimplexNoise();

    // get the basic dimensions of what we need to draw
    const width = this.w(); // - 2 * border;
    const height = this.h(); // - 2 * border;

    const alpha = 0.04;
    const dot_size = 0.001;
    const line_width = 0.005;

    const points = []; // hold the points for all the polygons
    const no_polys = 1;
    const no_points = choose([11, 13, 17, 19, 29, 51]);
    const no_relaxations = 4;
    const passes = rnd_range(800, 1500);
    const fill = rnd_range(0.1, 0.2);
    const mv = 0.0005; // rnd_range(0.021, 0.025);
    const scale = 0.01; // rnd_range(0.33, 0.55);
    /**
     * 1000 ends up very random
     * 100 convergest towards a point
     * 10 goes square like a building blueprint
     * 1 converges to a single point like a black hole
     * 0.1 creates like a soft flowing tube but long
     * 0.01 creates soft tube but tighter - needs lower fill
     * 0.001  really tight
     */

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

    for (let i = 0; i < passes; i++) {
      // now draw this iteration
      this.enqueue(new PolySandline({
        alpha,
        width, height,
        points: points[0],
        colours: fgs,
        dot_size, mv, fill, scale,
        simplex: this.simplex,
        t: (i + 1) // / passes
      }), opts.fg);
    }

    super.execute(opts);
  }
}
