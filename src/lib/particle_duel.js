import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';
import { Polygon } from './actions/index.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';
import { TAU } from './utils/geometry.js';

/**
 * Draw sandline style lines as emitted particles from the source
 *
 */

class ParticleSandline extends Actionable {
  /**
   * Create the ParticleSandline actionable
   *
   * @param {Object=} options - Options object to setup the action
   * @param {number} options.line_width - Width of line to draw as %
   * @param {number} options.dot_size - Width of line to draw as %
   * @param {Point} options.points - {@link Point} object for starting
   * @param {number} options.angle - Rotation in rads to emit at
   *
   */
  constructor(options={}) {
    const opts = options;
    super(opts);

    this.dot_size = opts.dot_size || 0.01;
    this.point = opts.point || [];
    this.mv = opts.mv || 0.02;
    this.fill = opts.fill || 0.5;
    this.scale = opts.scale || 1.0;
    this.simplex = opts.simplex;
    this.angle = opts.angle || 0; // main angle of facing
    this.deflection = opts.deflection || 0; // deflection off angle for this line
    this.line_length = opts.line_length || 0.5;
  }

  /**
   * Draw the Sandline to the context
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, point, dot_size, simplex, scale: s, angle, deflection, line_length } = this;

    super.draw(ctx);

    ctx.save();
    ctx.lineWidth = 0.01 * width; // temp
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = hsvts(colour);
    ctx.strokeStyle = hsvts(colour);

    // go to the point, rotate, choose a length to extend the ray and then
    // walk along it to fill it.

    ctx.save();
    ctx.translate(point.x * width, point.y * height);
    ctx.rotate(angle + deflection);

    // now we calculate the derived line length based on the angle so we don't
    // end up with two overlapping arcs. Uses the Law of Sines to work this out
    // as non right angle triangle. Sin A / a = Sin B / b = Sin C / c
    // so just work out the various values.
    //
    // Depending on the start point, we may be point in different directions
    // which can cause some challenges. So we need to rebaseline the x axis
    // based on how far we need to rotate around the quadrants.
    const a = deflection;
    const no_quadrants = Math.floor(angle / (0.5 * Math.PI));
    const angle_reaxised = angle - (0.5 * Math.PI * no_quadrants);
    let b;
    if (a < 0) {
      b = Math.PI - Math.abs(angle_reaxised);
    } else {
      b = 0.5 * Math.PI - Math.abs(angle_reaxised);
    }

    const c = Math.PI - b - a;

    const derived_line_length = line_length * Math.sin(b) / Math.sin(c);

    /**
    if (deflection < 0) {
      residual_angle = Math.PI - angle - deflection;
      derived_line_length = line_length * Math.sin(angle) / Math.sin(residual_angle);
    } else {
      residual_angle = Math.PI - (Math.PI * 0.5 - Math.abs(angle)) - deflection;
      // if you reverse these it creates an intersting arc
      derived_line_length = line_length * Math.sin(0.5 * Math.PI - Math.abs(angle)) / Math.sin(residual_angle);
    }
    **/

    const p1 = {x: derived_line_length, y: 0};
    const p2 = {x: 0, y: 0};

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

    // restore translate, rotation
    ctx.restore();

    // restore original transform
    ctx.restore();
  }
}
/**
 * Duelling particles that emit in different directions
 *
 */

export default class DuellingParticles extends Drawable {
  /**
   * Constructs the DuellingParticles Drawable
   * @param {Object} options - the options for this drawable
   *
   */
  constructor(options={}) {
    const opts = options;
    opts.name = 'duellingparticles';
    opts.border = 0.01;
    super(opts);
  }

  /**
   * Starts the drawing process
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

    opts.bg = [0, 0, 0]; // bg; // [47, 6, 100];
    opts.fg = fgs[0];
    opts.fgs = fgs;

    this.simplex = new SimplexNoise();

    // get the basic dimensions of what we need to draw
    const width = this.w(); // - 2 * border;
    const height = this.h(); // - 2 * border;

    const alpha = 0.10;
    const dot_size = 0.001;

    const points = []; // hold the points for the particle emitters
    const angles = []; // hold the base angle direction
    const passes = 800; // rnd_range(800, 1500);
    const fill = 0.10; // rnd_range(0.1, 0.2);
    const mv = 0.025; // rnd_range(0.021, 0.025);
    const scale = 0.01; // rnd_range(0.33, 0.55);
    const skew = rnd_range(0.99, 0.1);
    const angular_deflection = rnd_range(0.08, 0.11); // doubled as can go either way -> 90deg
    /**
     * 1000 ends up very random
     * 100 convergest towards a point
     * 10 goes square like a building blueprint
     * 1 converges to a single point like a black hole
     * 0.1 creates like a soft flowing tube but long
     * 0.01 creates soft tube but tighter - needs lower fill
     * 0.001  really tight
     */

    fgs[0][2] = 90;
    fgs[1][2] = 90;

    // point 1
    points.push({x: rnd_range(0.1, 0.33), y: rnd_range(0.3, 0.7)});
    // point 2
    points.push({x: rnd_range(0.67, 0.9), y: rnd_range(0.1, 0.9)});

    const pdx = points[1].x - points[0].x;
    const pdy = points[1].y - points[0].y;

    // calculate angle from point 1 to point 2
    angles.push(Math.atan(pdy / pdx));
    angles.push(angles[0] + Math.PI);

    // get the differences between the two points.
    const line_length = Math.sqrt(pdx * pdx + pdy * pdy);

    for (let i = 0; i < passes; i++) {
      // draw a line from each point
      for (let p = 0; p < points.length; p++) {
        // now draw this iteration
        this.enqueue(new ParticleSandline({
          alpha,
          width, height,
          point: points[p],
          dot_size, mv, fill, scale,
          simplex: this.simplex,
          line_length,
          angle: angles[p],
          deflection: rnd_range(-1 * skew * angular_deflection * TAU, angular_deflection * TAU),
          t: (i + 1) // / passes
        }), fgs[p % 2]);
      }
    }

    super.execute(opts);
  }
}
