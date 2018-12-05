'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable';

import { Actionable } from './actions';

import { choose, rnd_range } from './utils/random';
import { hsvts, rank_contrast } from './utils/draw';

const TAU = Math.PI * 2;
const EMPTY = Symbol('empty');

class Line {
  constructor(options) {
    const opts = options || {};

    this.width = opts.width || 100;
    this.height = opts.height || 100;
    this.x1 = opts.x1 || 0;
    this.y1 = opts.y1 || 0;
    this.x2 = opts.x2 || 100;
    this.y2 = opts.y2 || 100;
    this.line_width = opts.line_width || 0.01;

    this.shade = opts.shade || 0.1;
    this.alpha = opts.alpha || 0.5;
  }

  draw(ctx, colour) {
    // draws a single line
    const { x1, y1, x2, y2, width, height } = this;

    const pdx = x2 - x1;
    const pdy = y2 - y1;
    const h = Math.sqrt(pdx*pdx + pdy*pdy);

    ctx.save();
    ctx.translate(x1 * width, y1* height);
    ctx.rotate(Math.atan2(pdy, pdx));
    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);
    ctx.lineWidth = this.line_width * width;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(h * width, 0);
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = 0.15 * this.alpha;
    ctx.beginPath();
    ctx.rect(0, 0, h * width, h * 0.05 * height);
    ctx.fill();
    ctx.restore(); // alpha

    ctx.restore(); // translate / rotate
  }
}

class LineSystem {
  // used to simply control the iteration of the system
  constructor(options) {
    const opts = options || {};

    this.cols = opts.cols || 1;
    this.rows = opts.cols || 1;
    this.line_width = opts.line_width || 0.001;
    this.seeds = opts.seeds || 3;
    this.width = opts.width;
    this.height = opts.height;

    this.grid = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r * this.cols + c] = EMPTY;
      }
    }

    this.lines = [];
  }

  init() {
    // create some starting points.
    for (let s = 0; s < this.seeds; s++) {
      const x = rnd_range(0, this.cols);
      const y = rnd_range(0, this.rows);
      const r = Math.random() * TAU;

      this.grid[y * this.cols + x] = r;
    }
  }

  start_line() {
    // starts a line
    const timeout = 100;
    let time = 0;
    let found = false;

    let x;
    let y;

    // find a location which already has a line on it.
    while (! found && ++time < timeout) {
      x = rnd_range(0, this.cols);
      y = rnd_range(0, this.rows);

      if (this.grid[y * this.cols + x] != EMPTY) {
        found = true;
      }
    }

    let t = 0;
    if (found) {
      const dir = choose([-1, 1]);
      const mv = rnd_range(0.001, 0.02)
      t = this.grid[y * this.cols + x] + ((0.25 + mv) * TAU * dir);
    }

    return {x, y, t};
  }

  update(ctx) {
    // updates the state of the system.

    const {cols, rows, grid, width, height } = this;

    for (let i = 0; i < 10; i++) {
      const {x , y, t} = this.start_line();
      if (x && y) {
        // choose a random direction.
        // iterate along it until you hit a bound or another point
        // determine endpoint
        // add it to the current line list to be drawn

        // const t = Math.random() * TAU;
        let obstructed = false;
        // use this to hold the points in the grid we cross
        const pts = [{x, y}];
        let r = 1;
        const timeout = 10000;
        let time = 0;
        while (! obstructed && ++time < timeout) {
          const x2 = x + Math.round(Math.cos(t) * r);
          const y2 = y + Math.round(Math.sin(t) * r);

          // check bounds first
          if (x2 > 0 && x2 < cols && y2 > 0 && y2 < rows) {
            if (grid[y2 * cols + x2] != EMPTY) {
              obstructed = true;
              pts.push({x: x2, y: y2});
            } else {
              pts.push({x: x2, y: y2});
            }
          } else {
            obstructed = true;
          }
          r = r + 1;
        }

        // now we have a list of points iterating a long a line
        // firstly now set them all to full

        if (pts.length > 1) {
          const p1 = pts[0];
          const p2 = pts[pts.length - 1];
          const pdx = p2.x - p1.x;
          const pdy = p2.y - p1.y;
          const d = Math.sqrt(pdx*pdx + pdy*pdy) / cols; // normalise

          if (d > 0.001) {
            // check if the line is long enough and then set the grid points
            // along the line as well as queue the line up to br drawn

            pts.forEach((pt) => {
              grid[pt.y * cols + pt.x] = t;
            });

            this.lines.push(new Line({
              x1: p1.x / cols,
              y1: p1.y / rows,
              x2: p2.x / cols,
              y2: p2.y / rows,
              line_width: this.line_width * d,
              width, height
            }));
          }
        }
      }
    }
  }

  draw(ctx, colour, ...rest) {
    // draws the new lines to the grid.
    //
    const { width, height } = this;

    ctx.globalAlpha = this.alpha;

    while (this.lines.length > 0) {
      const l = this.lines.pop();
      l.draw(ctx, colour);
    }
  }
}

class LineSystemUpdate extends Actionable {
  // does the actual updating of the system

  constructor(options) {
    const opts = options || {};
    super(opts);

    this.system = opts.system;
  }

  draw(ctx, colour, ...rest) {
    // in this instance, draw is really just a system update call as the
    // draw in this case is delegated to the `LineSystem`
    super.draw(ctx);
    ctx.globalAlpha = this.alpha;
    this.system.update();
    this.system.draw(ctx, colour, rest);
    ctx.restore();
  }
}

export default class Subdivision extends Drawable {
  // draw lines that subdivide

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'subdivision';
    opts.border = 0.05;
    super(opts);
  }

  draw(seed, options) {
    // set off the drawing process.
    // `seed` provides a random seed as an `int` to use for recreation
    // `options` is an object which is inherited from `super` and
    // then any other options specific

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
    const border = Math.floor(this.w(this.border));
    const width = this.w(); // - 2 * border;
    const height = this.h(); // - 2 * border;

    const line_width = 0.003; // Math.ceil((this.w()-border) / no_lines);
    const rows = (1.0 - 2 * this.border) / line_width;
    const cols = (1.0 - 2 * this.border) / line_width;
    const seeds = choose([5, 7, 11, 13, 17, 19]);
    const updates = rnd_range(100, 250);

    console.log(rows, cols, line_width, seeds, updates);

    const linesystem = new LineSystem({
      rows, cols, line_width,
      width, height,
      seeds
    });
    linesystem.init();

    for (let i = 0; i < updates; i++) {
      this.enqueue(new LineSystemUpdate({
        alpha: 0.8,
        width, height,
        system: linesystem,
        t: i
      }), opts.fgs[i % (opts.fgs.length-1)]);
    }

    super.execute(opts);
  }
}


