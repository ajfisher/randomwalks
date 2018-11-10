'use strict';

import { hsvts, rnd_range } from '../utils';

import Actionable from '../actions/actionable';

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

    ctx.lineWidth = this.size;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    // ctx.arc(x2, y2 , 2, 0, Math.PI * 2)
    // ctx.fill();
    ctx.stroke();
  }
}

export default class ParticleSystem {
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

export class ParticleUpdate extends Actionable {
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
