import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable.js';
import Drawable from './drawable.js';

import { Circle, Point, PointVector, Triangle } from './primatives/Shape.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';
import { rescale } from './utils/maths.js';
import { TAU } from './utils/geometry.js';

class DrawDot extends Actionable {
  /**
   * Create the actionable
   *
   * @param {Object=} options - the various options for this drawing
   * @param {Mask=} options.mask - a mask to apply to this drawing
   * @param {Point} options.dot - A {@link Point} to draw with
   * @param {Number=} options.r - The radius to draw the dot
   *
   */
  constructor(options={}) {
    super(options);

    this.dot_width = options.dot_width || 0.001;
    this.mask = options.mask || null;
    this.dot = options.dot || null;
    this.r = options.r || 0.01;
    this.line_width = options.line_width || null;
  }

  /**
   * Draw the Dot to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, dot, r } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);
    if (this.line_width) {
      ctx.lineWidth = this.line_width * width;
    }

    ctx.beginPath();
    ctx.arc(dot.x * width, dot.y * height, r * width, 0, TAU);
    if (this.line_width) {
      ctx.stroke();
    } else {
      ctx.fill();
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
 * Draw the a set of triangles from the queue
 *
 * @extends Actionable
 *
 */
class DrawTriangles extends Actionable {
  /**
   * Create the actionable
   *
   * @param {Object=} options - the various options for this drawing
   * @param {Mask=} options.mask - a mask to apply to this drawing
   * @param {Triangle[]} options.triangles - An array of {@link Triangle}s to draw
   * @param {Number=} options.fill_chance - chance we will fill instead of stroke
   * @param {Colour=} options.alt_fill - HSV colour array for an alternative fill
   *
   */
  constructor(options={}) {
    super(options);

    this.dot_width = options.dot_width || 0.001;
    this.mask = options.mask || null;
    this.triangles = options.triangles || [];
    this.fill_chance = options.fill_chance || 0.1;
    this.alt_fill = options.alt_fill || [0,0,0]; // alternative fill colout
  }

  /**
   * Draw the Triangles to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, triangles, dot_width, fill_chance } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();

    ctx.lineWidth = dot_width * width;

    for (let t = 0; t < triangles.length; t++) {
      // set up the context with correct values for this iteration
      ctx.globalAlpha = rescale(0, 1, 0.4, 0.9, triangles[t].centroid.y);
      ctx.strokeStyle = hsvts(colour);
      ctx.fillStyle = hsvts(colour);

      const points = triangles[t].points;

      // just walk the points of the triangle and draw the lines between them
      ctx.beginPath();
      ctx.moveTo(points[0].x * width, points[0].y * height);
      for (let p = 1; p < points.length; p++) {
        ctx.lineTo(points[p].x * width, points[p].y * height);
      }
      ctx.closePath();
      ctx.stroke();
      if (Math.random() < fill_chance) {
        if (Math.random() < fill_chance) {
          ctx.fillStyle = hsvts(this.alt_fill);
        }
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
 * Draw the a triangle from the queue
 *
 * @extends Actionable
 *
 */
class DrawTriangle extends Actionable {
  /**
   * Create the actionable
   *
   * @param {Object=} options - the various options for this drawing
   * @param {Mask=} options.mask - a mask to apply to this drawing
   * @param {Triangle} options.triangle - A {@link Triangle} to draw with
   * @param {Noise} options.noise - a noise object to use for this drawing
   *
   */
  constructor(options={}) {
    super(options);

    this.dot_width = options.dot_width || 0.001;
    this.mask = options.mask || null;
    this.triangle = options.triangle || null;
    this.noise = options.noise || null;
  }

  /**
   * Draw the Triangle to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, triangle, dot_width, t } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);

    ctx.lineWidth = dot_width * width;

    const points = triangle.points;
    // here we might relax them a bit.

    // just walk the points of the triangle and draw the lines between them
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (let p = 1; p < points.length; p++) {
      ctx.lineTo(points[p].x * width, triangle.points[p].y * height);
    }
    ctx.closePath();
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
 * Draw a cascade of triangles along a vector
 * @extends Drawable
 *
 */
export default class TriangleFall extends Drawable {
  /**
   * Constructs the TriangleFall Drawable
   * @param {Object} options - the options for this drawable
   *
   */
  constructor(options={}) {
    const opts = options;
    opts.name = 'trianglefall';
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

    opts.bg = bg; // [47, 6, 100];
    opts.fg = fgs[0];
    opts.fgs = fgs;

    // get the basic dimensions of what we need to draw
    const width = this.w(); // - 2 * this.border;
    const height = this.h(); // - 2 * this.border;

    const simplex = new SimplexNoise();

    const dot_width = 0.0005;
    const no_triangles = choose([1, 2, 3]);
    const start_point = new Point(rnd_range(0.03, 0.97), rnd_range(0.02, 0.08));
    const dest_point = new Point(rnd_range(0.03, 0.97), rnd_range(0.95, 0.99));

    for (let i = 0; i < no_triangles; i++) {
      const t = new Triangle([
        start_point, dest_point,
        new Point(rnd_range(0.1, 0.9), rnd_range(0.1, 0.9))
      ]);

      if (i == 0) {
        // draw a circle this one time so everything goes over the top
        this.enqueue(new DrawDot({
          alpha: 0.8,
          width, height,
          dot: t.centroid,
          r: rnd_range(0.15, 0.35)
        }), opts.fgs[2]);
      }


      const triangles = t.subdivide(choose([7, 8, 11, 14]), rnd_range(0.1, 0.3));
      const chunk = 250; // how many triangles to draw in one frame.
      const no_chunks = triangles.length / chunk;

      for (let c = 0; c < no_chunks; c++) {
        const start = c * chunk;
        const tris = triangles.slice(start, start + chunk);

        this.enqueue(new DrawTriangles({
          alpha: 1,
          width, height,
          triangles: tris,
          dot_width,
          fill_chance: 0.1,
          alt_fill: opts.fgs[3],
          t: c
        }), opts.fg);
      }
    }


    /**
    // set up to draw a circle in another colour at some point during the
    // building of the triangles
    let circle_drawn = false;
    const circle_perc = 0.3;

    for (let ray = 0; ray < no_rays; ray++) {
      const triangles = [];

      const mv = start_point.distance(dest_point) / no_triangles;
      // create a unit vector pointing towards the destination
      let curr_point = new PointVector(start_point.x, start_point.y,
        start_point.angle_to(dest_point), mv);

      for (let t = 0; t < no_triangles; t++) {
        // recalibrate the current point to push back towards the destination.
        curr_point = new PointVector(curr_point.x, curr_point.y,
          curr_point.angle_to(dest_point), mv);

        // now calculate a step and update the x and y pos
        const dx = curr_point.length * Math.cos(curr_point.angle);
        const dy = curr_point.length * Math.sin(curr_point.angle);

        let y_mv = 0.25;
        let x_mv = 1;
        if (curr_point.y < 0.25) {
          y_mv = 0.3;
          x_mv = 1;
        } else if (curr_point > 0.7) {
          y_mv = 0.6;
          x_mv = 5;
        } else {
          y_mv = 1.8;
          x_mv = 8;
        }

        curr_point.x = curr_point.x + (dx * x_mv);
        curr_point.y = curr_point.y + (dy * y_mv);

        // scale the triangle by how far down the y axis we are
        const r = rescale(0, 1, 0.005, 0.25, curr_point.y);
        // quick way to make a triangle is to get a circle then choose
        // three random points from it's perimeter
        const c = new Circle({x: curr_point.x, y: curr_point.y, r});
        const tri = c.random_triangle();
        triangles.push(tri);

        // get the triangle drawn
        this.enqueue(new DrawTriangle({
          alpha: rescale(0, 1, 0.4, 0.9, tri.centroid.y),
          width, height,
          triangle: tri,
          dot_width: rescale(0, 1, 0.0005, 0.003, tri.centroid.y),
          t: (t + 1) / no_triangles
        }), opts.fg);

        if (curr_point.y > 0.4 && ! circle_drawn && Math.random() < circle_perc) {
          console.log(' drawing the circle');
          circle_drawn = true;
          this.enqueue(new DrawDot({
            alpha: 0.6,
            width, height,
            dot: c,
            r: c.r * 2
          }), opts.fgs[2]);
        }
      }

      // update the destination point
      dest_point.x = dest_point.x + rnd_range(-0.4, 0.4);
    }
    **/


    super.execute(opts);
  }
}

