import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable.js';
import Drawable from './drawable.js';

import { DrawDot, DrawDotList, DrawArc, DrawLineList, DrawPath, DrawTriangle, DrawTriangles } from './actions/Basics.js';
import { Rectangle } from './actions/rect.js';
import { BezierCurve, Circle, Line, Point, PointVector, Rect, Triangle } from './primatives/Shape.js';
import { CircleMask, PolyMask } from './masks/index.js';
import { VectorHatchFill } from './fills/index.js';
import { PointField } from './fields/PointField.js';

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
   * Sets up the Stacked arc drawing to be drawn to the screen
   *
   * @param {number} seed - random seed to be used for this design
   * @param {DrawOptions} options - the {@link DrawOptions} for this drawing
   *
   */
  stacked_arc_draw(seed, options) {
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

  /**
   * Create a circle and test hatched vector fills on it.
   *
   * @param {number} seed - random seed to be used for this design
   * @param {DrawOptions} options - the {@link DrawOptions} for this drawing
   *
   */
  hatched_draw(seed, options) {
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

    // get the basic dimensions of what we need to draw
    const width = this.w(); // - 2 * this.border;
    const height = this.h(); // - 2 * this.border;

    const simplex = new SimplexNoise();

    const line_width = 0.001;
    const c = new Circle({x: 0.5, y: 0.5, r: 0.3});

    const no_hatches = 5;

    const mask = new CircleMask({
      height, width,
      translate: { x: c.x, y: c.y },
      radius: c.r
    });

    let angle = rnd_range(-TAU, TAU);
    for (let h = 0; h < no_hatches; h++) {
      const x = rnd_range(0.4, 0.6);
      const y = rnd_range(0.4, 0.6);
      angle = angle + rnd_range(-TAU / 4, TAU / 4);
      const length = rnd_range(0.2, 0.9);

      const fill = new VectorHatchFill({
        alpha: 1,
        width, height,
        mask,
        line_width,
        fill_width: rnd_range(0.5, 0.9),
        vector: new PointVector(x, y, angle, length),
        colour: [0, 0, 0],
        density: rnd_range(0.05, 0.2),
        noise: simplex
      });

      this.enqueue(new DrawArc({
        alpha: 0.8,
        width, height,
        line_width: 0.005,
        circle: c,
        start: 0,
        end: TAU,
        fill,
        t: h
      }), [0, 0, 0]);
    }

    super.execute(opts);
  }

  /**
   * Create triangle strips and then do subdivision on them
   *
   * @param {number} seed - random seed to be used for this design
   * @param {DrawOptions} options - the {@link DrawOptions} for this drawing
   *
   */
  draw_twists(seed, options) {
    // get or create the seed
    this.seed = parseInt(seed, 10) || null;
    const opts = options || {};

    // prep the object with all the base conditions
    super.init(opts);

    // add the specific drawing actions now
    const palette = this.palette;

    const { bg, fgs } = rank_contrast(palette);

    opts.bg = bg; // EGGSHELL;
    opts.fg = fgs[0];
    opts.fgs = fgs;

    // get the basic dimensions of what we need to draw
    const width = this.w(); // - 2 * this.border;
    const height = this.h(); // - 2 * this.border;

    const simplex = new SimplexNoise();

    const line_width = 0.001;

    const no_grids = 1;
    const mv_amt = rnd_range(0.002, 0.005);
    const no_passes = rnd_range(150, 300);
    const distortion = rnd_range(100, 400) * mv_amt;
    const fill_chance = rnd_range(0.01, 0.03);
    const cell_size = rnd_range(0.02, 0.07);
    const mv = mv_amt * cell_size;

    console.log(no_passes, fill_chance, cell_size, mv, distortion)

    const circle = new Circle({
      x: choose([0.37, 0.5, 0.63]) + rnd_range(-0.05, 0.05),
      y: choose([0.37, 0.5, 0.63]) + rnd_range(-0.05, 0.05),
      r: rnd_range(0.15, 0.3)
    });

    this.enqueue(new DrawDot({
      alpha: rnd_range(0.1, 0.25),
      width, height,
      dot: circle,
      r: circle.r,
      t: 1
    }), opts.fgs[2]);

    for (let g = 0; g < no_grids; g++) {
      // go from -0.1 to +1.1 so it's wider than the screen
      const start_x = rnd_range(-0.3, 0.1) ;
      const end_x = rnd_range(0.9, 1.3);
      const start_y = rnd_range(-0.3, 0.1);
      const end_y = rnd_range(0.9, 1.3);

      // create a grid of rows and columns
      const no_rows = (end_y - start_y) / cell_size + 1;
      const no_cols = (end_x - start_x) / cell_size + 1;

      const grid = [];

      for (let r = 0; r < no_rows; r++) {
        const row = [];
        const cy = start_y + (r * cell_size);
        for (let c = 0; c < no_cols; c++) {
          // offset the x starting point on every other row
          const dx = simplex.noise3D(c / no_cols, r / no_rows, 0);
          const dy = simplex.noise3D(r / no_rows, c / no_cols, 0);
          const offset = (r % 2) ? 0.5 * cell_size : 0;
          const cx = start_x + offset + (c * cell_size);
          const x = cx + (dx * distortion);
          const y = cy + (dy * distortion);
          row.push(new Point(x, y));
        }
        grid.push(row);
      }

      // now iterate over the grid and make a new mesh each time.
      for (let p = 0; p < no_passes; p++) {
        // recalculate the position of the grid
        for (let r = 0; r < no_rows; r++) {
          for (let c = 0; c < no_cols; c++) {
            // get the noise for this point for this iteration
            const dx = simplex.noise3D(c / no_cols, r / no_rows, p / no_passes);
            const dy = simplex.noise3D(r / no_rows, c / no_cols, p / no_passes);
            grid[r][c].x = grid[r][c].x + (dx * mv);
            grid[r][c].y = grid[r][c].y + (dy * mv);
          }
        }

        // build a set of triangles to plot
        const triangles = []
        for (let r = 0; r < no_rows - 1; r++) {
          // determine which way the rows stack then offset against the lower row
          // as needed to get an appropriate cell match
          const offset = (grid[r][0].x < grid[r+1][0].x) ? 0 : 1;
          for (let c = 0; c < no_cols-2; c++) {
            // get triangle using upper line base
            triangles.push(new Triangle([
              new Point(grid[r][c].x, grid[r][c].y),
              new Point(grid[r+1][c+offset].x, grid[r+1][c+offset].y),
              new Point(grid[r][c+1].x, grid[r][c+1].y)
            ]));
            // get triangle using lower line base
            triangles.push(new Triangle([
              new Point(grid[r+1][c+offset].x, grid[r+1][c+offset]),
              new Point(grid[r][c+1].x, grid[r][c+1].y),
              new Point(grid[r+1][c+offset+1].x, grid[r+1][c+offset+1].y)
            ]));
          }
        }

        // now draw the triangles of the grid at this point in time
        this.enqueue(new DrawTriangles({
          alpha: 0.01,
          width, height,
          triangles,
          line_width,
          fill_chance,
          t: (p+1) / no_passes
        }), opts.fg);
      }
    }

    super.execute(opts);
  }
  /**
   * Create a simple line to give a mountain
   *
   * @param {number} seed - random seed to be used for this design
   * @param {DrawOptions} options - the {@link DrawOptions} for this drawing
   *
   */
  draw_mountain(seed, options) {
    // get or create the seed
    this.seed = parseInt(seed, 10) || null;
    const opts = options || {};

    // prep the object with all the base conditions
    super.init(opts);

    // add the specific drawing actions now
    const palette = this.palette;

    const { bg, fgs } = rank_contrast(palette);

    opts.bg = bg; // EGGSHELL;
    opts.fg = fgs[0];
    opts.fgs = fgs;

    // get the basic dimensions of what we need to draw
    const width = this.w(); // - 2 * this.border;
    const height = this.h(); // - 2 * this.border;

    const simplex = new SimplexNoise();

    const line_width = 0.001;

    const start_x = -0.1;
    const end_x = 1.1;
    const start_y = 0.5;

    const mv = rnd_range(0.01, 0.05);
    const no_points = (end_x - start_x) / mv;
    const s = 1000; // scale factor

    const points = [];
    let y = start_y
    for (let p = 0; p < no_points; p++) {
      // go from -0.1 to +1.1 so it's wider than the screen

      const x = start_x + (p * mv);
      const dy = simplex.noise2D(x * s, (p / no_points) * s);
      y = y + (dy * mv);
      points.push(new Point(x, y));
    }

    this.enqueue(new DrawPath({
      alpha: 0.7,
      width, height,
      points,
      line_width,
      t: 1
    }), opts.fg);

    const mask_points = [...points];
    mask_points.push(new Point(end_x, 1));
    mask_points.push(new Point(start_x, 1));

    const mask = new PolyMask({
      height, width,
      points: mask_points,
      invert: true
    });

    const circle = new Circle({
      x: choose([0.37, 0.5, 0.63]) + rnd_range(-0.05, 0.05),
      y: choose([0.37, 0.5, 0.63]) + rnd_range(-0.05, 0.05),
      r: rnd_range(0.15, 0.3)
    });

    this.enqueue(new DrawDot({
      alpha: rnd_range(0.15, 0.25),
      width, height,
      dot: circle,
      r: circle.r,
      mask,
      t: 1
    }), opts.fgs[2]);

    super.execute(opts);
  }
  /**
   * Draw a joined path across the screen
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
    const width = this.w(); //  - 2 * this.border;
    const height = this.h(); //  - 2 * this.border;

    const dot_width = 0.001;
    const mv = 0.01;
    const edge_mv = 0.05;
    const no_lines = rnd_range(40, 70);
    const no_passes = rnd_range(50,80);
    const alpha = 1.5 / no_passes;
    const cp_change_chance = rnd_range(0.01, 0.06);

    const simplex = new SimplexNoise();
    const no_grids = 1;

    for (let g = 0; g < no_grids; g++) {
      const tl = new Point(rnd_range(0.02, 0.4), rnd_range(0.01, 0.4));
      const bl = new Point(rnd_range(0.02, 0.4), rnd_range(0.6, 0.95));
      const br = new Point(rnd_range(0.6, 0.95), rnd_range(0.6, 0.95));
      const tr = new Point(rnd_range(0.6, 0.97), rnd_range(0.01, 0.4));

      const vert_e1 = new Line(tl, bl);
      const vert_e2 = new Line(tr, br);
      const hori_e1 = new Line(tl, tr);
      const hori_e2 = new Line(bl, br);

      // use these to have trackable control points between passes.
      let cp1 = new Point(rnd_range(tl.x, br.x), rnd_range(tl.y, br.y));
      let cp2 = new Point(rnd_range(tl.x, br.x), rnd_range(tl.y, br.y));

      for (let pass = 0; pass < no_passes; pass++) {
        const lines = [];
        if (Math.random() < cp_change_chance) {
          cp1 = new Point(rnd_range(tl.x, br.x), rnd_range(tl.y, br.y));
          cp2 = new Point(rnd_range(tl.x, br.x), rnd_range(tl.y, br.y));
        }

        // update the position of the control points.
        const cp1_dx = simplex.noise2D(cp1.x, pass / no_passes) * mv;
        const cp1_dy = simplex.noise2D(cp1.y, pass / no_passes) * mv;
        cp1.x = cp1.x + cp1_dx;
        cp1.y = cp1.y + cp1_dy;

        const cp2_dx = simplex.noise2D(cp2.x, pass / no_passes) * mv;
        const cp2_dy = simplex.noise2D(cp2.y, pass / no_passes) * mv;
        cp2.x = cp2.x + cp2_dx;
        cp2.y = cp2.y + cp2_dy;

        // create a snapshot copy of the local control points so they don't get
        // updated in subsequent iterations before the draw phase
        const l_cp1 = new Point(cp1.x, cp1.y);
        const l_cp2 = new Point(cp2.x, cp2.y);

        // iterate from left to right across x to determine points for the lines
        for (let l = 0; l <= no_lines; l++) {
          // jitter the amount of lerp you do for the points.
          const p1 = vert_e1.lerp(l / no_lines);
          const p2 = vert_e2.lerp(l / no_lines);
          p1.x = p1.x + simplex.noise3D(p1.x, p1.y, pass / no_passes) * edge_mv;
          p2.x = p2.x + simplex.noise3D(p2.x, p2.y, pass / no_passes) * edge_mv;

          lines.push(new BezierCurve(p1, p2, l_cp1, l_cp2));

          const vp1 = hori_e1.lerp(l / no_lines);
          const vp2 = hori_e2.lerp(l / no_lines);
          vp1.x = vp1.x + simplex.noise3D(vp1.x, vp1.y, pass / no_passes) * edge_mv;
          vp2.x = vp2.x + simplex.noise3D(vp2.x, vp2.y, pass / no_passes) * edge_mv;
          lines.push(new BezierCurve(vp1, vp2, l_cp1, l_cp2));
        }

        /**
        this.enqueue(new DrawDot({
          alpha: 0.4,
          width, height,
          dot: l_cp1,
          r: 0.01,
          t: pass
        }), opts.fg);
        this.enqueue(new DrawDot({
          alpha: 0.4,
          width, height,
          dot: l_cp2,
          r: 0.01,
          t: pass
        }), opts.fg);
        **/

        this.enqueue(new DrawLineList({
          alpha,
          width, height,
          lines,
          line_width: dot_width,
          t: pass
        }), opts.fgs[g % opts.fgs.length]);
      }
    }

    super.execute(opts);
  }
}
