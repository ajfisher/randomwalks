import _ from 'lodash';
const { minBy, maxBy } = _;

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';
import { Polygon } from './actions/index.js';
import { PolyMask } from './masks/index.js';
import { CircleMask } from './masks/index.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';
import { chaikin, convex, TAU } from './utils/geometry.js';

/**
 * Draw sandline style lines around a polygon
 *
 * @class
 * @extends Actionable
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
   * @param {Point[]} options.points - Array of {@link Point} objects
   * @param {Point=} options.centroid - {@link Point} for the centroid location
   * @param {number} options.fill_angle - The % shift around the centroid to move on each ray.
   *
   */
  constructor(options={}) {
    const opts = options;
    super(opts);

    this.line_width = opts.line_width || 0.01;
    this.points = opts.points || [];
    this.centroid = opts.centroid || {x: 0, y: 0};
    this.line_length = opts.line_length || 0.1;
    this.fill_angle = opts.fill_angle || 0.02 * TAU;
    this.mask = opts.mask || null;
    this.simplex = opts.simplex || null;
    this.scale = opts.s || 0.1;
    this.mv = opts.mv || 0.1;
    this.burst_gap = opts.burst_gap || 0.01; // distance between ray and burst
    this.burst_amt = opts.burst_amt || 0.08; // amount of burst to add
    this.colours = opts.colours || []; // array of fg colours to use.
  }

  /**
   * Draw the burst to the context
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const {
      width, height, points, line_width, line_length,
      centroid, fill_angle, simplex, scale, mv,
      burst_gap, burst_amt,
      colours
    } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.lineWidth = line_width * width;
    ctx.lineCap = 'round';
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = hsvts(colour);
    ctx.strokeStyle = hsvts(colour);

    // determine how many rays we need to draw in a full rotation
    const no_rays = Math.floor(TAU / fill_angle);

    for (let r = 0; r < no_rays; r++) {
      // conduct a full rotation and draw the lines outwards from the centre
      const angle = (r / no_rays) * TAU;

      const line_length_noise = simplex.noise2D((r+1) * scale, (angle+1) / TAU * scale);
      const ray_length = line_length + (line_length_noise * mv);

      const x = centroid.x + (ray_length * Math.cos(angle));
      const y = centroid.y + (ray_length * Math.sin(angle));

      // draw the ray from the centre
      ctx.beginPath();
      ctx.moveTo(centroid.x * width, centroid.y * height);
      ctx.lineTo(x * width, y * height);
      ctx.strokeStyle = hsvts(colours[0]);
      ctx.stroke();

      // now we draw the second part of the ray further out.
      // get the burst starting point.
      const b1_dist = ray_length + burst_gap; // calculate H from centre point
      const bx1 = centroid.x + (b1_dist * Math.cos(angle));
      const by1 = centroid.y + (b1_dist * Math.sin(angle));
      const burst_length = burst_amt * ray_length;

      // now we get the burst ending point
      const b2_dist = b1_dist + burst_length;
      const bx2 = centroid.x + (b2_dist * Math.cos(angle));
      const by2 = centroid.y + (b2_dist * Math.sin(angle));

      // now we draw the line for the burst
      ctx.beginPath();
      ctx.moveTo(bx1 * width, by1 * height);
      ctx.lineTo(bx2 * width, by2 * height);
      ctx.strokeStyle = hsvts(colours[1]);
      ctx.stroke();

      // and finally draw a little dot on the end
      const dot_dist = b2_dist + burst_gap; // calculate H from centre point
      const dot_x = centroid.x + (dot_dist * Math.cos(angle));
      const dot_y = centroid.y + (dot_dist * Math.sin(angle));

      ctx.beginPath();
      ctx.moveTo(dot_x * width, dot_y * height);
      ctx.arc(dot_x * width, dot_y * height, 0.5 * line_width * width, 0, TAU);
      ctx.fillStyle = hsvts(colours[2]);
      ctx.fill();
    }

    // restore original transform
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }
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
    opts.border = 0.01;
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

    const TYPE = 'BURSTS';

    if (TYPE == 'SANDLINE') {
      this.simplex = new SimplexNoise();

      const alpha = 0.04;
      const dot_size = 0.001;
      const line_width = 0.004;
      const line_length = 0.25;

      const points = []; // hold the points for all the polygons
      const no_polys = 2;
      const no_points = choose([11, 13, 17, 19]);
      const no_relaxations = 4;
      const passes = rnd_range(500, 800);
      const fill = rnd_range(0.05, 0.1);
      const mv = 0.0015; // rnd_range(0.021, 0.025);
      const scale = 1000; // rnd_range(0.33, 0.55);
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

        for (let i = 0; i < passes; i++) {
          // now draw this iteration
          this.enqueue(new PolySandline({
            alpha,
            width, height,
            points: points[poly],
            colours: fgs,
            dot_size, mv, fill, scale,
            simplex: this.simplex,
            t: (poly+1) + ((i + 1) / passes)
          }), opts.fgs[poly]);
        }
      }
    } else if (TYPE == 'BURSTS') {
      // now we do the bursts
      this.simplex = new SimplexNoise();
      const alpha = 0.8;
      const line_width = 0.007;
      const line_length = 0.25;
      const fill_angle = TAU * 0.01;
      const scale = 0.1;
      const mv = 0.1;

      const no_polys = 1;
      const no_points = choose([11, 13, 17, 23]);
      const no_relaxations = 4;

      // create the relaxed polygons.
      for (let poly = 0; poly < no_polys; poly++) {
        let points = [];
        // choose some random points to add to the polygon
        for (let p = 0; p < no_points; p++) {
          points.push({
            x: rnd_range(0.35, 0.65),
            y: rnd_range(0.35, 0.65)
          });
        }
        // now order the points into a convex hull
        points = convex(points);

        // find the centre through a really crap means
        const minx = minBy(points, 'x').x;
        const maxx = maxBy(points, 'x').x;
        const miny = minBy(points, 'y').y;
        const maxy = maxBy(points, 'y').y;

        const centroid = {
          x: minx + 0.5 * (maxx - minx),
          y: miny + 0.5 * (maxy - miny)
        }

        // relax the control polygon using Chaikin Curve algorithm
        for (let c = 0; c < no_relaxations; c++) {
          points = chaikin(points);
        }

        const mask = new PolyMask({
          width, height,
          translate: {x: 0, y: 0},
          points,
          invert: true
        });

        this.enqueue(new Burst({
          alpha,
          width, height,
          line_width,
          line_length,
          fill_angle,
          centroid,
          mask,
          colours: fgs,
          simplex: this.simplex,
          s: scale,
          mv,
          t: 1
        }), opts.fg);

        this.enqueue(new Polygon({
          alpha: 0.1,
          width, height,
          points,
          centroid,
          line_width: 0.002,
          style: 'LINES'
        }), opts.fg);
      }
    }

    super.execute(opts);
  }
}
