'use strict';

import SimplexNoise from 'simplex-noise';

import Actionable from './actions/actionable';
import Drawable from './drawable';

import { choose, constrain, hsvts, rank_contrast } from './utils';
import { rescale, rnd_range } from './utils';

const TAU = Math.PI * 2;

class ForceField {
  // creates a field of forces based on a grid.
  constructor(rows, cols, noise, scale) {
    // creates a new `ForceField` of rows and cosl
    // can take any noise function which must take a x and y value and will
    // return a -1.0..1.0 float.

    this.rows = rows;
    this.cols = cols;
    this.noise = noise;

    this.scale = scale || 0.05;

    this.forces = [];
    for (let x = 0; x < cols; x++) {
      const col = [];
      for (let y = 0; y < rows; y++) {
        const c = {
          f: this.noise.noise2D(x * this.scale, y * this.scale) * Math.PI
        };

        // work out the components of the force vector
        c.xf = Math.cos(c.f);
        c.yf = Math.sin(c.f);

        col.push(c);
      }
      this.forces.push(col);
    }
  }
}

class Particle {
  // provides a single particle which x,y is represented as value between
  // 0 and 1 in both axes to make it relational to the canvas.
  constructor(x, y, xv, yv, options) {
    // creates a new particle with initial conditions.

    this.position = {
      x: x || 0,
      y: y || 0,
      xo: x || 0,
      yo: y || 0
    };
    this.velocity = {
      x: xv || 0,
      y: yv || 0
    };

    const opts = options || {};
    this.m = opts.m || 0.0001;  // mass - currently single unit value.
    this.bounds = opts.bounds || {x: 100, y: 100};
    this.size = opts.size || 2; // size in pixels provided
  }

  update() {
    // updates the position of the particle based on it's current velocity.

    // update the old position
    this.position.xo = this.position.x;
    this.position.yo = this.position.y;

    // now update the new position.
    this.position.x = this.position.x + this.velocity.x;
    this.position.y = this.position.y + this.velocity.y;

    // rotate the items around the bounds
    if (this.position.x < 0) {
      this.position.x = this.position.x + 1.0;
      this.position.xo = 1.0;
    } else if (this.position.x > 1.0) {
      this.position.x = this.position.x - 1.0;
      this.position.xo = 0.0;
    }

    if (this.position.y < 0) {
      this.position.y = this.position.y + 1.0;
      this.position.yo = 1.0;
    } else if (this.position.y > 1.0) {
      this.position.y = this.position.y - 1.0;
      this.position.yo = 0.0;
    }
  }

  apply(xf, yf) {
    // takes a force and applies it to the particle's velocity.
    this.velocity.x = this.velocity.x + this.m * xf;
    this.velocity.y = this.velocity.y + this.m * yf;

    // apply some friction
    this.velocity.x *= 0.99;
    this.velocity.y *= 0.99;
  }

  draw(ctx, colour) {
    // draws the particle to the context at it's current position.

    ctx.strokeStyle = hsvts(colour);

    const x1 = this.position.xo * this.bounds.x;
    const y1 = this.position.yo * this.bounds.y;

    const x2 = this.position.x * this.bounds.x;
    const y2 = this.position.y * this.bounds.y;

    ctx.lineWidth = 8; // this.size;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    // ctx.arc(x2, y2 , 2, 0, Math.PI * 2)
    // ctx.fill();
    ctx.stroke();
  }
}

class ParticleSystem {
  // orchestrates the manipulation of the system
  constructor(options) {
    // sets up the initial conditions
    const opts = options || {};

    this.no = options.no_particles || 100;

    this.particles = [];
    this.bounds = {
      x: opts.bounds.x || 100,
      y: opts.bounds.y || 100
    };

    this.force_field = opts.force_field;

    // size of the particles. Expressed in pixels but provided
    // based on the DPI from the controller.
    this.size = opts.size || 2;
  }

  init() {
    // creates the initial conditions of the particle system

    const particles = this.no;

    for (let p = 0; p < particles; p++) {
      // chose a random location to start and a random velocity
      const particle = new Particle(
        rnd_range(0.001, 0.999), rnd_range(0.001, 0.999), //  p / particles,
        0, 0,
        {bounds: this.bounds, size: this.size});
      this.particles.push(particle);
    }
  }

  update() {
    // updates the state of the system

    // this needs to apply the force field matrix to each particle in turn.
    this.particles.forEach((p, i) => {
      // get force vector based on which cell the particle is in.

      const cx = Math.floor(p.position.x * this.force_field.cols);
      const cy = Math.floor(p.position.y * this.force_field.rows);
      const f = this.force_field.forces[cx][cy];

      p.apply(f.xf, f.yf)
    });
    this.particles.forEach(p => p.update());
  }

  draw(ctx, colour, ...rest) {
    // renders the current state of the particles out to the screen.
    this.particles.forEach(p => p.draw(ctx, colour, rest));
  }
}

class ParticleUpdate extends Actionable {
  // Updates the particle system appropriately
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.system = opts.system;
  }

  draw(ctx, colour, ...rest) {
    // in this instance, draw is really just a system update call as the
    // draw in this case is delegated to the `ParticleSystem`
    super.draw(ctx);
    ctx.globalAlpha = this.alpha;
    this.system.update();
    this.system.draw(ctx, colour, rest);
  }
}

class FlowGrid extends Actionable {
  // Draws a grid of items that represents the flow field.
  constructor(options) {
    const opts = options || {};
    super(opts);

    this.cols = opts.cols;
    this.rows = opts.rows;
    this.cell_w = Math.round(this.width / this.cols);
    this.cell_h = Math.round(this.height / this.rows);
    this.simplex = opts.simplex;
    this.field = opts.field || [];
    this.bg = opts.bg;
    this.colours = opts.colours;
  }

  draw(ctx, colour, ...rest) {
    // draws the flow field grid.
    super.draw(ctx, colour);

    const hue = colour[0];

    const cw_h = this.cell_w * 0.5;
    const ch_h = this.cell_h * 0.5;

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        // iterate over the grid and draw the force field

        ctx.save();
        ctx.translate(x * this.cell_w, y * this.cell_h);
        ctx.lineWidth =  2;
        ctx.globalAlpha = this.alpha;

        // draw a line from the middle, aligned to the flow field.
        ctx.save();
        ctx.translate(cw_h, ch_h);
        ctx.rotate(this.field.forces[x][y].f);

        ctx.beginPath();
        let ll = 0.4 * this.cell_w; // * 0.5;
        if (ll < cw_h) ll = cw_h;

        ctx.moveTo(-ll, 0);
        ctx.lineTo(ll, 0);
        ctx.stroke();

        // draw a ball on the end
        ctx.beginPath();
        ctx.fillStyle = hsvts([180, 100, 100]);
        ctx.globalAlpha = this.alpha;
        ctx.arc(ll, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // restore the rotation
        ctx.restore(); // restore the translation.
      }
    }

    /**
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const s = 0.05;
        const noise = this.simplex.noise2D(x * s, y * s);

        ctx.save();
        ctx.translate(x * this.cell_w, y * this.cell_h);
        ctx.strokeStyle = hsvts([0, 100, 100]) // hsvts([h, colour[1], colour[2]]);
        ctx.lineWidth =  2; // rnd_range(Math.round(0.1 * this.cell_w), cw_h);
        ctx.globalAlpha = 0.45;

        // draw the grid
        /**
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.cell_w, 0);
        ctx.lineTo(this.cell_w, this.cell_h);
        ctx.lineTo(0, this.cell_h);
        ctx.lineTo(0, 0);
        ctx.stroke();

        // draw a line from the middle, aligned to the flow field.
        ctx.save();
        ctx.translate(cw_h, ch_h);
        ctx.rotate(noise * Math.PI);

        ctx.beginPath();
        let ll = 0.4 * this.cell_w; // * 0.5;
        if (ll < cw_h) ll = cw_h;

        ctx.moveTo(-ll, 0);
        ctx.lineTo(ll, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = hsvts([0, 100, 100]);
        ctx.globalAlpha = 0.5;
        ctx.arc(ll, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        // go back to the other space.
        ctx.restore(); 
      }
    } **/
  }
}

export default class FlowField extends Drawable {
  // flow field shows a field of simplex noise in a grid where you can see
  // the flow lines.

  constructor(options) {
    // build a new flow field.

    const opts = options || {};
    opts.name = 'flowfield';
    opts.border = 0.01;
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
    const width = this.w() - 2 * border;
    const height = this.h() - 2 * border;

    const cell_nos = choose([13, 37, 53, 103, 153]);
    const no_particles = choose([1000, 2000, 3000, 5000]);
    const scale = choose([0.01, 0.05, 0.07]);

    console.log(cell_nos, no_particles, scale);
    const cols = cell_nos;
    const rows = cell_nos;

    this.simplex = new SimplexNoise();

    const particles = new ParticleSystem({
      no_particles,
      bounds: {x: width, y: height},
      force_field: new ForceField(rows, cols, this.simplex, scale),
      size: this.cm(0.02)
    });

    particles.init();

    this.enqueue(new FlowGrid({
      alpha: 0.001,
      width,
      height,
      translate: { x: border, y: border },
      rotate: 0,
      cols,
      rows,
      simplex: this.simplex,
      colours: opts.fgs,
      field: particles.force_field,
      t: 1
    }), opts.fg);

    const iter = 1000;
    for (let i = 0; i < iter; i++) {
      this.enqueue(new ParticleUpdate({
        alpha: 0.02,
        width,
        height,
        system: particles,
        t:i
      }), opts.fg);
    }

    super.execute(opts);
  }
}
