'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { choose, hsvts, rand_range, weight_rnd } from './utils.js';

export default class Flow extends Drawable {
  // creates a flow test

  constructor(options) {
    super(options);

    const opts = options || {};
    this.simplex = null;
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
    const palette = this.palette;
    // opts.bg = [60, 6, 100];
    opts.bg = [47, 6, 100];

    this.simplex = new SimplexNoise(this.seed);

    super.execute(opts);
  }
}
