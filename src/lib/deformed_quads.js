'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import Drawable from './drawable.js';

import { hsvts } from './utils.js';

class Quad {
  // a single quadrilateral defined as a set of vertices
  constructor(vertices, colour=[0, 0, 0], fill=false, options) {
    // pass in a bunch of veritce
    this.vertices = vertices;
    this.colour = colour;
  }

  draw(ctx, colours) {
    // render the actual quadrilateral out
    const { vertices } = this;

    console.log(this, vertices);

    ctx.fillStyle = hsvts(this.colour);
    ctx.beginPath();
    ctx.moveTo(vertices[0][0], vertices[0][1]);
    ctx.lineTo(vertices[1][0], vertices[1][1]);
    ctx.lineTo(vertices[2][0], vertices[2][1]);
    ctx.lineTo(vertices[3][0], vertices[3][1]);
    ctx.lineTo(vertices[0][0], vertices[0][1]);
    ctx.fill();
  }
}

export default class DeformedQuads extends Drawable {
  // creates a set of deformed quadrilaterals
  // Deformed quadrilaterals creates a grid of quadrilaterals
  // that starts off sort of square-like but then the vertices
  // are pertubed a small amount on each iteration. This advances
  // in the X and Y planes of the grid to multiply the effect
  // through the progression.
  // a --- b
  // |     |
  // d --- c

  constructor(options) {
    super(options);

    const opts = options || {};
    this.rows = 13;
    this.cols = 13;
    this
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
    // opts.bg = [46, 11, 94];
    // opts.bg = [50, 5, 95];
    opts.bg = [60, 6, 100];
    // opts.bg = [71, 13, 96];
    // now execute the drawing.

    console.log(this);
    this.enqueue(
      new Quad([
        [this.w(0.1), this.h(0.1)],
        [this.w(0.5), this.h(0.1)],
        [this.w(0.5), this.h(0.4)],
        [this.w(0.1), this.h(0.4)]
      ]), palette[0] );

    super.execute(opts);
  }
}
