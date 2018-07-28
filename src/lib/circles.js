'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { choose, hsvts, rand_range, weight_rnd } from './utils.js';

const TAU = Math.PI * 2;

class Circle {
  // draws a circle and allows a bunch of operations on it.

  constructor(options) {
    const opts = options || {};

    this.p = opts.p || 0;
    this.q = opts.q || 0;
    this.r = opts.r || 100;

    this.fill = opts.fill || false;
    this.colour = opts.colour || 'black';
    this.line_wdith = opts.line_width || 4;
  }

  draw(ctx, colour) {
    // draws a circle of the given colour or the constructed one
    // if none is provided

    const c = colour || this.colour;

    ctx.save();
    ctx.strokeStyle = hsvts(c);
    if (this.fill) {
      ctx.fillStyle = hsvts(c);
    }

    ctx.lineWidth = this.line_width;

    ctx.translate(this.p, this.q); // now we can run the circle at (0,0)
    ctx.globalAlpha = 0.3
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, TAU);
    if (this.fill) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
    ctx.restore();
  }

  chord(ctx, colour, t1, t2) {
    // draws a specific chord using a method of providing two angles relative
    // on the circle, t1 and t2. From this, using the angle, x and y can be
    // derived by knowing the circle radius and from there x = cos(t) . r
    // and y = sin(t) . r

    // derive the location of points on the circle perimeter
    const x1 = Math.cos(t1) * this.r;
    const y1 = Math.sin(t1) * this.r;
    const x2 = Math.cos(t2) * this.r;
    const y2 = Math.sin(t2) * this.r;

    ctx.save();
    ctx.translate(this.p, this.q); // now we can run the circle at (0,0)
    ctx.strokeStyle = hsvts(colour);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  chord_fill(ctx, colour, p1, p2, options) {
    // starts with a pair of angles and then proceeds to draw parallel chords
    // to that point.

    const opts = options || {};

    const pc = p1 + (p2 - p1) / 2;
    const no_chords = opts.no || rand_range(15, 40);
    const angle_step = (pc - p1) / no_chords;
    console.log(p1, p2, (p2-p1), (p2-p1) / 2, pc, angle_step);

    for (let i=0; i< no_chords; i++) {
      const angle_amt = i * angle_step;
      this.chord(ctx, colour, p1 + angle_amt, p2 - angle_amt);
    }
  }
}

export default class CircleChord extends Drawable {
  // test drawing a circle with a chord through it.

  constructor(options) {
    const opts = options || {};
    opts.name = 'circle_chord';
    super(opts);

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
    opts.bg = [47, 6, 100];

    super.execute(opts);

    const { ctx } = this;

    const p = this.w(0.5);
    const q = this.h(0.5);
    const r = rand_range(this.w(0.1), this.w(0.4));

    // draw x and y
    /**
    ctx.strokeWeight = '1px';
    ctx.strokeStyle = 'grey';
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, this.h());
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, q);
    ctx.lineTo(this.w(), q);
    ctx.stroke();
    **/

    // let's just draw a circle.
    const c = new Circle({p, q, r, fill: false, colour: this.fg});
    c.draw(ctx);

    // get the points you want to draw a chord between, expressed as angles
    const p1 = rand_range(0.00001, TAU);
    const p2 = rand_range(0.00001, TAU);
    c.chord_fill(ctx, this.fg, p1, p2);

    /**
    // now, work out angle of a line to draw the chord.
    // only need to do this for half a circle
    const theta = Math.random() * Math.PI; // in rads
    const m = Math.tan(theta); // tan θ = opp / adj = m
    const b0 = rand_range(-0.999, 0.999) * r;

    const dir = choose([-1, 1]);
    // const b_end = rand_range(b, (dir * r));
    const chord_step = rand_range(0.02 * r, 0.1 * r);


    // loop along and draw the chords parallel to the first in the direction
    // of travel.

    ctx.save();
    ctx.translate(p, q); // now we can run the circle at (0,0)
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < no_chords; i++) {
      // get the next chord in the series
      const b =  b0 + chord_step * i * dir;

      // solve components of the quadratic formula
      // derived from solving y = mx+b and (x - p)^2 + (y - q)^2 = r^2
      // simultaneiously and then solving for X which is quadratic.
      // Due to our translation, p = q = 0 which simplifies the components in
      // the quadratic.
      const A = m*m + 1;
      const B = 2 * m * b;
      const C = (b*b - r*r);

      // solve the discriminant
      const disc = Math.sqrt(B*B - (4 * A * C));
      if (disc <= 0) {
        continue; // tangent line or complex solution, don't do it
      }

      // get the X values.
      const x1 = (-1 * B + disc) / (2 * A);
      const x2 = (-1 * B - disc) / (2 * A);

      // solve for y;
      const y1 = m * x1 + b;
      const y2 = m * x2 + b;

      if (i === 0) {
        ctx.strokeStyle = 'green';
      } else {
        ctx.strokeStyle = hsvts(this.fg);
      }
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // figure out the tangent line.
    // the tangent is the point where the discriminant = 0 (touches once)
    // thus (B^2 - 4AC) = 0
    // Following, it means we can solve for quadratic of x = -B / 2A
    // By replacement
    // x = (-2mb) / 2 x (m^2 + 1)
    // we know slope of the line so find the y-intercept to get eqn of line
    // thus, derived by replacement and solving for above (ie when x=0)
    // b = sqrt( (m^2 + 1) . r^2 )
    // But b is indeterminate, so needs to be mul by dir to get the correct
    // side of the circle and the chord being plotted
    const b_tan = Math.sqrt( (m*m + 1) * (r*r) ) * dir;
    // then we can solve discretely
    const x_tan = (-2 * m * b_tan) / (2 * (m*m + 1));

    const x1 = x_tan - (0.5 * r);
    const x2 = x_tan + (0.5 * r);
    const y1 = m * x1 + b_tan;
    const y2 = m * x2 + b_tan;
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    **/
    ctx.restore();
  }
}
