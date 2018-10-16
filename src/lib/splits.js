'use strict';

import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable';
import Drawable from './drawable';

import { Block } from './primatives';

import { choose, constrain, hsvts, rank_contrast } from './utils';
import { rescale, rnd_range } from './utils';

const TAU = Math.PI * 2;

class Pass extends Actionable {
  // draws a set of lines in one pass.

  constructor(options) {
    // sets up the pass. Quite a complex set up so requires an object to
    // do it with the baseline parts sent back to the Actionable AC.
    //
    const opts = options || {};
    super(opts);

    this.lines = opts.lines || this.width || 10;
    this.line_width = opts.line_width || this.width / this.lines;
    this.top = opts.top || { colour: [0, 100, 100], h: this.height / 2};
    this.bottom = opts.bottom || { colour: [180, 100, 100], h: this.height / 2};
    this.simplex = opts.simplex;
  }

  draw(ctx, ...rest) {
    // does the action of drawing the lines for this particular pass

    const { bottom, line_width, simplex, t, top } = this;

    ctx.save();

    // handle draw set up
    super.draw(ctx)

    // get the starting points for the lines.
    let y1 = rnd_range(-0.9, 0.9);
    let y2 = rnd_range(-0.9, 0.9);

    let mv = 0.05;
    let s = 0.05;

    if (this.classic) {
      mv = 0.1;
      s = 1;
    }

    // draw the lines
    for (let l = this.lines * -1; l < this.lines; l++) {
      // walk the line and then use simplex noise to guide the change amount.

      // convert to the actual x point needed.
      const x = l * line_width;

      // get y as a proportion still, using simplex noise.
      y1 = constrain(y1, [-1.1, 1.1]);
      y2 = constrain(y2, [-1.1, 1.1]);
      y1 = y1 + (simplex.noise3D(l*s, t*s, y1*1) * mv);
      y2 = y2 + (simplex.noise3D(l*s, t*s, y2*10) * mv);

      // normalise the proportional values to actual pixel values.
      let min_y = Math.min(y1, y2);
      let max_y = Math.max(y1, y2);
      min_y = Math.floor((min_y <= 0) ? min_y * top.h : min_y * bottom.h);
      max_y = Math.floor((max_y <= 0) ? max_y * top.h : max_y * bottom.h);

      if ((min_y < 0 && max_y < 0) || (min_y >= 0 && max_y > 0)) {
        // we only need to draw on one side
        ctx.fillStyle = hsvts(min_y < 0 ? top.colour : bottom.colour);
        ctx.fillRect(x, min_y, line_width, max_y-min_y);
      } else {
        // need to draw both sides now.
        ctx.fillStyle = hsvts(top.colour);
        ctx.fillRect(x, min_y, line_width, 0 - min_y); // will end on zero
        ctx.fillStyle = hsvts(bottom.colour);
        ctx.fillRect(x, 0, line_width, max_y);
      }
    }

    ctx.restore();
  }
}

export default class Split extends Drawable {
  // split class creates a split screen with a colour.

  constructor(options) {
    const opts = options || {};
    opts.name = 'splits';
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

    opts.bg = [47, 6, 100];
    // opts.bg = bg;
    opts.fg1 = bg;
    opts.fg2 = fgs[0];
    opts.fgs = fgs;

    // determine proportion and direction of the split
    const proportions_list = [0.619, 0.381];
    // how much of a tau to rotate.
    const rotations = [-0.25, -0.15, -0.05, 0, 0.05, 0.15, 0.25];
    const focuses = [0.381, 0.5, 0.619];

    // get the basic dimensions of what we need to draw
    const border = Math.floor(this.w(this.border));
    const total_w = this.w() - 2 * border;
    const total_h = this.h() - 2 * border;
    const x_l = border;
    const y_t = border;

    // work out how the canvas will be split up
    const proportion = choose(proportions_list);
    const focus = choose(focuses);
    const top_split = Math.floor(proportion * total_h);
    const bottom_split = Math.floor(total_h - top_split);
    const left = Math.floor(focus * total_w);
    const right = Math.floor(total_w - left);

    // determine the number of lines we'll produce on each pass.
    const no_lines = rnd_range(500, 1200);
    const line_width = Math.ceil(total_w / no_lines);

    // how many passes to produce and their opacity proportionately.
    const no_passes = rnd_range(2, 8);
    const line_alpha = rescale(2, 8, 0.55, 0.25, no_passes);
    const translate = {x: x_l + left, y: y_t + top_split};
    const rotate = choose(rotations) * Math.random();

    // simplex noise pulls uses the next prng from seedrandom
    this.simplex = new SimplexNoise();

    // draw the background blocks
    this.enqueue(new Block({
      alpha: 1.0,
      width: total_w,
      height: -top_split*2,
      translate,
      rotate,
      mirror: true
    }), opts.fg1);
    this.enqueue(new Block({
      alpha: 1.0,
      width: total_w,
      height: bottom_split*2,
      translate,
      rotate,
      mirror: true
    }), opts.fg2);

    // do a pass of the lines.
    for (let p = 0; p < no_passes; p++) {
      this.enqueue(new Pass({
        lines: no_lines,
        line_width,
        alpha: line_alpha,
        top: {colour: opts.fg2, h: top_split},
        bottom: {colour: opts.fg1, h: bottom_split},
        width: total_w, height: total_h,
        translate, rotate,
        simplex: this.simplex,
        t: p
      }), null);
    }

    super.execute(opts);
  }
}

