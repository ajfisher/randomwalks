'use strict';

import Actionable from './actionable';

import { hsvts } from '../utils';

export default class FieldGrid extends Actionable {
  // Draws a grid of lines that represents the flow field.
  constructor(options) {
    const opts = options || {};
    super(opts);

    if (typeof opts.field === 'undefined') {
      throw new Error('field is required');
    }
    this.field = opts.field;

    this.cols = this.field.cols;
    this.rows = this.field.rows;
    this.cell_w = Math.round(this.width / this.cols);
    this.cell_h = Math.round(this.height / this.rows);

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

