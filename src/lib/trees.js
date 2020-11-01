'use strict';

import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable }  from './actions/index.js';
import { ApplyGrain } from './concentrics.js';

import { choose, rnd_range } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';

const TAU = Math.PI * 2;

class Tree extends Actionable {
  // draws the actual tree.
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.simplex = opts.simplex || false;
    this.stem_width = opts.stem_width || 0.002;
    this.colours = opts.colours || [];

    this.axiom = choose(['F', 'FF', 'FX']);
    const rules = [
      'F[[-FX]F[+FX]]',
      'F[[-F]F[+F]F]',
      'F[[-F][FF][+F]]',
      'F[[-F][FX][+F]]',
      'F[[-F]F[[-F][+F]]]',
      'F[++F-F--F][--F+F+F]'
    ]
    this.rules = {
      'F': 'F[F-F+FX][FF[-FF][+F]]' // choose(rules)
    }
    this.l = 'F'; // this.axiom;
    // this.l = 'F[-F[-F][+FF]][+F[-F][+FF[-FF][F+F]]]]';
    this.branch_angle = rnd_range(0.03, 0.15) * TAU;
    this.branch_length = rnd_range(0.05, 0.07);
    this.reduction = rnd_range(0.9, 1.0);
    const iterations = rnd_range(3, 6);

    console.log(this.axiom, this.rules, this.branch_angle, this.branch_length,
      this.reduction, iterations);
    // make the l-system
    //
    for (let i = 0; i < iterations; i++) {
      let temp = '';
      for (let c = 0; c < this.l.length; c++) {
        const char = this.l[c];
        // test for a rule match
        if (typeof(this.rules[char]) !== 'undefined') {
          temp = temp + this.rules[char];
        } else {
          temp = temp + char;
        }
      }
      this.l = temp;
    }
  }

  draw(ctx, colour, ...rest) {
    // draws a stem

    const { width, height, simplex } = this;
    super.draw(ctx);

    // should now be translated etc so it's just a case of drawing a line out
    const mv = 0.02; // rnd_range(0.015, 0.03);
    const scale = 0.7; // choose([0.7, 0.5, 0.6]);
    const s = scale;

    // recursively work out the points.
    let pts = [];

    ctx.strokeStyle = hsvts(colour);
    ctx.fillStyle = hsvts(colour);
    ctx.lineWidth = this.stem_width * width;
    ctx.lineCap = 'round';
    ctx.globalAlpha = this.alpha;

    pts.push({x: 0, y:0});
    const branch_pts = this.calc_branch(ctx, this.l, 0.01, 0, pts[0], this.branch_length);
    pts = [...pts, ...branch_pts];

    ctx.save();
    ctx.moveTo(pts[0].x * width, pts[0].y * height);
    for (let p = 0; p < pts.length; p++) {
      if (pts[p].a == 'D') {
        ctx.lineTo(pts[p].x * width, pts[p].y * height);
      } else if (pts[p].a == 'BR') {
        ctx.moveTo(pts[p].x * width, pts[p].y * height);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  calc_branch(ctx, l_string, b_width, rotation, start, branch_length) {
    // using the string return a set of points relating to it.

    const {branch_angle} = this;

    let pts = [];
    let r = rotation;
    let last_pt = start;

    for (let l = 0; l < l_string.length; l++) {
      // go through each item in the string and then parse it
      const item = l_string[l];

      switch (item) {
        case 'F': {
          // move forward
          const x = last_pt.x + (branch_length * Math.cos(r));
          const y = last_pt.y + (branch_length * Math.sin(r));
          last_pt = {x, y, a: 'D'};
          pts.push(last_pt);
          // console.log('fwd', x, y);
          break;
        }
        case '[': {
          // create another branch
          // find full string of the branch
          let branch_count = 0;
          let end_index = 0;
          for (let c = l+1; c < l_string.length; c++) {
            if (l_string[c] == '[') {
              branch_count = branch_count + 1;
            } else if (l_string[c] == ']') {
              branch_count = branch_count - 1;
              if (branch_count < 0) {
                end_index = c;
                break;
              }
            }
          }

          const branch = l_string.substring(l+1, end_index);
          // console.log('make branch', branch);
          const branch_pts = this.calc_branch(ctx, branch, 0.01, r, last_pt,
            branch_length * this.reduction);
          // use this to skip back.
          const lp = {x: last_pt.x, y: last_pt.y, a: 'BR'};
          pts = [...pts, ...branch_pts, lp];
          // set l to the end of the branch
          l = end_index;
          break;
        }
        case ']': {
          // close off a branch
          // pts.push(last_pt);
          break;
        }
        case '-': {
          // rotate leftwards
          r = r - branch_angle;
          // console.log('rotate_left', r);
          break;
        }
        case '+': {
          // rotate rightwards
          r = r + branch_angle;
          // console.log('rotate_right', r);
          break;
        }
        default: {
          // noop
          // console.log(item);
          break;
        }
      }
    }
    // console.log(pts);
    return pts;
  } // end of the calc points option
}

export default class Trees extends Drawable {
  // Trees draws a set of trees on a plane.

  constructor(options) {
    // build a new flow field container.

    const opts = options || {};
    opts.name = 'trees';
    opts.border = 0.0;
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

    const trees = 1; // rnd_range(10, 50);

    /**
    this.enqueue(new ApplyGrain({
      alpha: 0.25,
      width, height,
      no: rnd_range(200, 1500),
      min: 0.002,
      max: 0.004
    }), opts.fgs[1]);
    **/

    this.simplex = new SimplexNoise();

    for (let t = 0; t < trees; t++) {
      // build a bunch of stems

      const x = rnd_range(0.05, 0.95);

      this.enqueue(new Tree({
        alpha: 0.7,
        width, height,
        translate: { x: 0.5, y: 0.8},
        rotate: -0.25, // rnd_range(-0.02, 0.02) * TAU,
        simplex: this.simplex,
        colours: opts.fgs,
        t
      }), opts.fgs[t % 4]);
    }

    this.enqueue(new ApplyGrain({
      alpha: 0.5,
      width, height,
      no: rnd_range(200, 400),
      min: 0.002,
      max: 0.004
    }), opts.fgs[1]);

    super.execute(opts);
  }
}
