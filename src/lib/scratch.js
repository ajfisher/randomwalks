'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { SimplexFill } from './fills/index.js';

import { choose, hsvts, rand_range, weight_rnd } from './utils.js';

export default class Scratch extends Drawable {
  // creates a test

  constructor(options) {
    const opts = options || {};
    opts.name = 'scratch';
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
    // opts.bg = [60, 6, 100];
    opts.bg = [47, 6, 100];

    this.simplex = new SimplexNoise(this.seed);


    super.execute(opts);

    // sf.fill(this.tx_ctx, [0,0,0]);

    const { ctx } = this;
    const steps = 900;
    const x1 = 50;
    const x2 = x1 + steps;
    const segs = 15;
    const seg_length = steps / segs;
    const tau = 2 * Math.PI;
    const y1 = 400;
    const y2 = 600;
    const y3 = 800;
    const y4 = 1000;
    const r1 = 10;
    const max_r = 0.2 * r1;
    ctx.fillStyle = '#000000';
    // ctx.globalAlpha = 0.01;
    for (let x = x1; x < x2; x++) {
      // let r = r1 - (((x - x1) / steps) * r1);
      // r = (r <= 0) ? 1 : r;
      const r = r1 + (this.simplex.noise2D(x, y1) * max_r);
      x = x + 0.5 * r;

      // const y = y1 + (this.simplex.noise2D(x, y1) * r);
      const y = y1;
      ctx.arc(x, y, r, 0, tau);
      ctx.fill();
    }

    let last_x = x1;
    let last_y = y2;
    for (let x = x1 + seg_length; x < x2; x = x + seg_length) {
      const lw = 5 * (r1 + (this.simplex.noise2D(x, y2) * max_r));
      const y = last_y + this.simplex.noise2D(x, last_y) * 10;
      ctx.beginPath();
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = hsvts([x, 100, 100]);
      ctx.globalAlpha = 0.3;
      ctx.moveTo(last_x, last_y);
      ctx.lineTo(x, y);
      ctx.stroke();
      last_x = x;
      last_y = y;
    }

    // try using quadratic curves now.
    // first make an array of points.
    const pts = [];
    let minx = x1;
    let miny = y3;
    let maxx = minx;
    let maxy = miny;
    for (let x = x1; x < x2; x = x + seg_length) {
      const y = y3 + this.simplex.noise2D(x, y3) * 30;
      pts.push({x, y});

      if (x < minx) minx = x;
      if (y < miny) miny = y;
      if (x > maxx) maxx = x;
      if (y > maxy) maxy = y;
    }

    const w = this.texture.width;
    const h = this.texture.height;
    // create the texture fill
    this.tx_ctx.clearRect(0,0, w, h);

    const sf = new SimplexFill({
      width: this.texture.width,
      height: this.texture.height,
      alpha: 1.0,
      scale: 0.2,
      steps: 512,
      simplex: this.simplex
    });

    sf.fill(this.tx_ctx, [0,0,0]);

    // draw the line to the predraw canvas to prep composition
    const pd_ctx = this.pd_ctx;
    pd_ctx.clearRect(0,0, w, h);

    pd_ctx.save();
    pd_ctx.strokeStyle = ctx.strokeStyle;
    pd_ctx.lineWidth = ctx.lineWidth;
    pd_ctx.globalAlpha = 1.0;
    pd_ctx.beginPath();
    pd_ctx.moveTo(pts[0].x, pts[0].y);
    let i = 0;

    for (i = 1; i < pts.length - 2; i++) {
      const c = (pts[i].x + pts[i+1].x) / 2;
      const d = (pts[i].y + pts[i+1].y) / 2;
      pd_ctx.quadraticCurveTo(pts[i].x, pts[i].y, c, d);
    }
    pd_ctx.quadraticCurveTo(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
    pd_ctx.stroke();

    pd_ctx.globalCompositeOperation = 'destination-out';
    pd_ctx.drawImage(this.texture, 0, 0);

    pd_ctx.restore();

    // now merge back to the main canvas
    ctx.globalAlpha = 1.0;
    ctx.drawImage(this.predraw, 0, 0);
  }
}
