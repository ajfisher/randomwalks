'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';

import { CircleGridMask } from './masks/index.js';
import { CircleFrame } from './primatives/index.js';

import { choose, rnd_range } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';

const TAU = Math.PI * 2;

class CircleFrameRow extends Actionable {
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.cols = opts.cols || 1;
    this.cell_size = opts.cell_size || 0.1;
    this.radius = opts.radius || 0.1;
    this.line_width = opts.line_width || 0.001;

    this.frames = [];

    for (let c = 0; c < this.cols; c++) {
      const position = {
        x: (c * this.cell_size) + (0.5 * this.cell_size),
        y: 0 // this.border + (r * cell_size) + (0.5 * cell_size)
      };

      this.frames.push( new CircleFrame({
        alpha: this.alpha,
        width: this.width, height: this.height,
        cols: this.cols,
        cell_size: this.cell_size,
        translate: position,
        radius: this.radius,
        line_width: this.line_width,
        t: 0
      }));
    }
  }

  draw(ctx, colour, ...rest) {
    // draw a row's worth of frames.
    const {width, height} = this;
    super.draw(ctx);

    for (let c = 0; c < this.cols; c++) {
      this.frames[c].draw(ctx, colour);
    }
  }
}


class Tile extends Actionable {
  // creates an individual tile

  static get DIRECTIONS() {
    return {N: 0, E: 1, S: 2, W: 3, C: 4 };
  }

  constructor(options) {
    const opts = options || {};
    super(opts);

    this.line_width = opts.line_width || 0.01;
    this.max_lw = opts.max_lw || 1;
    this.dot_size = opts.dot_size || 0.005;
    this.accent = opts.accent || [];
    this.no_lines = opts.no_lines || rnd_range(1, 4);

    if (typeof(opts.mask) === 'undefined') {
      this.mask = false;
    } else {
      this.mask = opts.mask;
    }

    this.cell_size = opts.cell_size || 0.1;

    this.directions = [
      {x: 0, y: 0, t: 'C'}, // centre
      {x: 0, y: -0.5, t: 'N'}, // north
      {x: 0.5, y: 0, t: 'E'}, // east
      {x: 0, y: 0.5, t: 'S'}, // south
      {x: -0.5, y: 0, t: 'W'} // west
    ];
  }

  draw(ctx, colour, ...rest) {
    const { height, width, line_width, cell_size } = this;

    if (this.mask) {
      this.mask.clip(ctx);
    }

    const xt = this.translate.x * this.width;
    const yt = this.translate.y * this.height;

    ctx.save();
    ctx.translate(xt, yt);
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = hsvts(colour);
    ctx.strokeStyle = hsvts(colour);

    // choose a random starting location
    // choose an ending location
    // draw between them
    for (let l = 0; l < this.no_lines; l++) {
      const p1 = choose(this.directions);
      const p2 = choose(this.directions);

      let lw = this.line_width;
      if (Math.random() < 0.2) {
        lw = lw * this.max_lw;
      }
      ctx.lineWidth = lw * width;

      if (p1 == p2) {
        this.circle(ctx, this.accent, p1);
      } else {
        ctx.beginPath();
        ctx.moveTo(p1.x * cell_size * width, p1.y * cell_size * height);
        if (Math.random() < 0.75) {
          ctx.lineTo(0, 0);
        }
        ctx.lineTo(p2.x * cell_size * width, p2.y * cell_size * height);
        ctx.stroke();
      }
    }

    // restore the move to make the translation
    ctx.restore();

    // restore out the mask point.
    ctx.restore();
  }

  circle(ctx, colour, pt) {
    // draws a circle at a particular point
    const {cell_size, width, height, dot_size } = this;

    let start_angle = 0;
    let end_angle = TAU;

    if (pt.t == 'N') {
      start_angle = 0.5 * TAU;
      end_angle = 0;
    } else if (pt.t == 'S') {
      start_angle = 0;
      end_angle = 0.5 * TAU;
    } else if (pt.t == 'E') {
      start_angle = 0.25 * TAU;
      end_angle = 0.75 * TAU;
    } else if (pt.t == 'W') {
      start_angle = 0.75 * TAU;
      end_angle = 0.25 * TAU;
    }

    ctx.save();
    ctx.fillStyle = hsvts(colour);
    ctx.strokeStyle = hsvts(colour);

    let ds = dot_size;
    const chance = Math.random();
    if (chance < 0.15) {
      ds = ds * 0.67;
    } else if (chance > 0.85) {
      ds = ds * 2;
    }

    ctx.beginPath();
    ctx.arc(pt.x * cell_size * width, pt.y * cell_size * height, ds * width,
      start_angle, end_angle);
    if (Math.random() < 0.6) {
      ctx.fill();
    } else {
      ctx.stroke();
    }

    ctx.restore();
  }
}

export default class Tiles extends Drawable {
  // create a set of tiles that link to each other across the canvas.
  // lines flow from one to the next

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'tiles';
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


    const rows = rnd_range(11, 23);
    const cols = rows;
    const cell_size = (1.0 - (2 * this.border)) / cols;
    const circle_size = 0.92 * cell_size;
    const rad = 0.5 * circle_size;
    const dot_size = 0.2 * rad;
    const line_width = 0.001; // Math.ceil((this.w()-border) / no_lines);
    const max_lw = choose([1, 1, 2, 2, 3, 4]);
    const no_lines = [3, 5];

    console.log(rows, cols, line_width, max_lw);

    const mask = new CircleGridMask({
      translate: {x: this.border, y: this.border},
      radius: rad,
      cell_size,
      rows, cols,
      width, height
    });

    for (let r = 0; r < rows; r++) {
      const y = (this.border + 0.5 * cell_size) + (r * cell_size);

      for (let c = 0; c < cols; c++) {
        const x = (this.border + 0.5 * cell_size) + (c * cell_size);

        this.enqueue(new Tile({
          alpha: 0.6,
          width, height,
          line_width,
          translate: { x, y },
          cell_size, dot_size, max_lw, mask,
          no_lines: rnd_range(no_lines),
          accent: opts.fgs[1],
          t: r * cols + c
        }), opts.fg);
      }
    }

    // add the circle frames
    for (let r = 0; r < rows; r++) {
      const position = {
        x: this.border,
        y: this.border + (r * cell_size) + (0.5 * cell_size)
      };

      this.enqueue(new CircleFrameRow({
        alpha: 0.4,
        width, height,
        cols, cell_size,
        translate: position,
        radius: rad,
        line_width: 0.001,
        t: 0
      }), opts.fg);
    }

    super.execute(opts);
  }
}

