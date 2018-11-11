'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable';

import { Actionable, FieldGrid }  from './actions';
import { SimplexField } from './fields';

import { CircleMask } from './masks';
import { CircleFrame } from './primatives';

import { choose, rnd_range } from './utils/random';
import { hsvts, rank_contrast } from './utils/draw';

export default class CircleField extends Drawable {
  // Circle field drives a set of particles across a circle of simplex noise
  // arranged in a grid which will use some basic physics to manipulate their
  // direction of travel. As they draw, this will result in visible flow lines
  // across the field.

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'circlefield';
    opts.border = 0;
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

    // const cell_nos = choose([119, 137, 153, 171]);
    const cell_nos = rnd_range(130, 330);

    const cols = cell_nos;
    const rows = cell_nos;

    this.simplex = new SimplexNoise();

    const scale = rnd_range(0.01, 0.07);
    console.log(cell_nos, scale);

    const field = new SimplexField(rows, cols, this.simplex, scale);

    const mask = new CircleMask({
      translate: { x: 0.5, y: 0.5 },
      radius: 0.4,
      width, height
    });

    this.enqueue(new FieldGrid({
      alpha: 0.5,
      width,  height,
      field,
      mask,
      translate: { x: border, y: border },
      rotate: 0,
      colours: opts.fgs,
      t: 1,
      draw_head: false,
      line_width: rnd_range(0.003, 0.005)
    }), opts.fg);

    this.enqueue(new CircleFrame({
      alpha: 1.0,
      width, height,
      translate: { x: 0.5, y: 0.5 },
      radius: 0.4,
      line_width: 0.01,
      t: 0
    }), opts.fg);

    super.execute(opts);
  }
}

