'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable';

import { Actionable, FieldGrid, ParticleUpdate } from './actions';
import { ParticleSystem } from './systems';
import { SimplexField } from './fields';

import { choose, rnd_range } from './utils/random';
import { hsvts, rank_contrast } from './utils/draw';

export default class FlowField extends Drawable {
  // flow field drives a set of particles across a field of simplex noise
  // arranged in a grid which will use some basic physics to manipulate their
  // direction of travel. As they draw, this will result in visible flow lines
  // across the field.

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'flowfield';
    opts.border = 0.04;
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

    const scales = [0.03, 0.01, 0.05, 0.07, 0.1 ];
    const cell_nos = choose([13, 37, 53, 103, 153]);
    const no_particles = choose([1000, 2000, 3000, 5000]);

    const cols = cell_nos;
    const rows = cell_nos;

    this.simplex = new SimplexNoise();

    const scale = choose(scales)
    console.log(cell_nos, no_particles, scale);

    const field = new SimplexField(rows, cols, this.simplex, scale);

    const particles = new ParticleSystem({
      no_particles,
      bounds: {x: width, y: height},
      force_field: field,
      size: this.cm(0.02)
    });

    particles.init();

    /**
    this.enqueue(new FieldGrid({
      field,
      alpha: 1.0,
      width,
      height,
      translate: { x: border, y: border },
      rotate: 0,
      colours: opts.fgs,
      t: 1
    }), opts.fgs[0]);
    **/

    const iter = 1000;
    for (let i = 0; i < iter; i++) {
      this.enqueue(new ParticleUpdate({
        alpha: 0.02,
        width,
        height,
        system: particles,
        t: i
      }), opts.fgs[0]);
    }

    super.execute(opts);
  }
}
