import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable.js';
import Drawable from './drawable.js';

import { DrawDot, DrawTriangle } from './actions/Basics.js';
import { Circle, Point, PointVector, Triangle } from './primatives/Shape.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';
import { rescale } from './utils/maths.js';
import { TAU } from './utils/geometry.js';

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
   * @param {Boolean=} options.invert - Invert the triangle, when true don't draw it.
   *
   */
  constructor(options={}) {
    super(options);

    this.line_width = options.line_width || 0.001;
    this.mask = options.mask || null;
    this.triangles = options.triangles || [];
    this.fill_chance = options.fill_chance || 0.1;
    this.alt_fill = options.alt_fill || [0,0,0]; // alternative fill colour
    this.alt_fill_chance = options.alt_fill_chance || 0.1; // alternative fill chance
    this.invert = options.invert || false;
  }

  /**
   * Draw the Triangles to the screen
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, triangles, line_width,
      fill_chance, alt_fill_chance, invert } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();

    ctx.lineWidth = line_width * width;

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

      if (! invert) {
        // if not inverted then we draw the outline. Otherwise we pass
        ctx.stroke();
      }

      if (Math.random() < fill_chance) {
        if (Math.random() < alt_fill_chance) {
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

    const TYPE = 'RECONSTRUCTION';

    if (TYPE == 'RECONSTRUCTION') {
      // do version with a dot and then triangle subdivision.
      // don't remove this as it makes a random call that is critical to the design
      this.simplex = new SimplexNoise();
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
            line_width: dot_width,
            fill_chance: 0.1,
            alt_fill: opts.fgs[3],
            t: c
          }), opts.fg);
        }
      }
    } else {
      // do version with a dot and then triangle subdivision.
      const line_width = 0.0005;
      const angle = TAU / rnd_range(15, 23);
      const no_triangles = TAU / angle; // choose([3, 5]);
      const circle = new Circle({x: 0.5, y: 0.5, r: 0.35});

      this.enqueue(new DrawDot({
        alpha: 0.3,
        width, height,
        dot: circle,
        r: circle.r
      }), opts.fgs[2]);

      this.enqueue(new DrawDot({
        alpha: 0.9,
        width, height,
        dot: circle,
        r: circle.r + 0.015,
        line_width: 0.005
      }), opts.fgs[2]);

      let pt_angle = rnd_range(-TAU, TAU);

      for (let i=0; i < no_triangles; i++) {
        // get a triangle from the circle
        const p1 = new Point(circle.x, circle.y);
        const p2 = circle.point_at(pt_angle);
        pt_angle = pt_angle + angle;//  + rnd_range(-0.05 * TAU, 0.05 * TAU);
        const p3 = circle.point_at(pt_angle);

        const t = new Triangle([ p1, p2, p3 ]);

        const triangles = t.subdivide(
          3 + Math.round(0.5 * i),
          // choose([9, 7]),
          rnd_range(0.05, 0.2)
        );
        const chunk = 950; // how many triangles to draw in one frame.
        const no_chunks = triangles.length / chunk;

        for (let c = 0; c < no_chunks; c++) {
          const start = c * chunk;
          const tris = triangles.slice(start, start + chunk);

          this.enqueue(new DrawTriangles({
            alpha: 1,
            width, height,
            triangles: tris,
            line_width,
            fill_chance: 0.20,
            alt_fill: opts.fgs[3],
            alt_fill_chance: (0.15 * i),
            invert: false,
            t: c
          }), opts.fg);
        }
      }
    }

    super.execute(opts);
  }
}

