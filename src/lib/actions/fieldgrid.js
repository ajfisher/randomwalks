'use strict';

import Actionable from './actionable.js';

import { choose, nrand, rnd_range } from '../utils/random.js';
import { hsvts } from '../utils/draw.js';

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

    if (typeof(opts.mask) === 'undefined') {
      this.mask = false;
    } else {
      this.mask = opts.mask;
    }

    this.line_width = opts.line_width || 0.001;
    this.bg = opts.bg;
    this.colours = opts.colours;

    // have to set this this way due to lazy eval;
    this.draw_head = true;
    if (! opts.draw_head) {
      this.draw_head = false;
    }

    this.bands = {
      xb1: { m: rnd_range(0.1, 0.3), s: rnd_range(0.1, 0.2) },
      xb2: { m: rnd_range(0.3, 0.7), s: rnd_range(0.1, 0.5) },
      xb3: { m: rnd_range(0.6, 0.9), s: rnd_range(0.3, 0.5) },
      yb1: { m: rnd_range(0.1, 0.3), s: rnd_range(0.1, 0.3) },
      yb2: { m: rnd_range(0.3, 0.7), s: rnd_range(0.2, 0.5) },
      yb3: { m: rnd_range(0.6, 0.9), s: rnd_range(0.3, 0.5) }
    }
  }

  colour_map(x, y) {
    // takes the x and y positions and then determines what colour options
    // are available which is returned as an array.
    // work out what colour to draw it
    const { xb1, xb2, xb3, yb1, yb2, yb3 } = this.bands;
    const { line_width, width } = this;

    const colour_opts = [];
    const style_opts = [];

    const x_pos = x / this.cols;
    const y_pos = y / this.rows;

    // use a series of nrands with different gaussian distributions to work
    // out if we add the value or not.
    if (x_pos < nrand(xb1.m, xb1.s)) {
      colour_opts.push(this.colours[1]);
    }
    if (x_pos > nrand(xb2.m, xb2.s)) {
      colour_opts.push(this.colours[2]);
    }
    if (x_pos > nrand(xb3.m, xb3.s)) {
      colour_opts.push(this.colours[3]);
    }
    if (y_pos < nrand(yb1.m, yb1.s)) {
      style_opts.push([1, 0]); // solid line
    }
    if (y_pos > nrand(yb2.m, yb2.s)) {
      style_opts.push([line_width * width, 0.5 * line_width * width]);
    }
    if (y_pos > nrand(yb3.m, yb3.s)) {
      style_opts.push([0.5 * line_width * width, 4 * line_width * width]);
    }
    if (colour_opts.length == 0) {
      colour_opts.push(this.colours[1]);
      style_opts.push([1, 0]); // solid line
    }

    return { colour_opts, style_opts };
  }

  draw(ctx, colour, ...rest) {
    // draws the flow field grid.
    super.draw(ctx, colour);

    if (this.mask) {
      this.mask.clip(ctx);
    }

    const cw_h = this.cell_w * 0.5;
    const ch_h = this.cell_h * 0.5;

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        // iterate over the grid and draw the force field

        const map = this.colour_map(x, y);
        const c = choose(map.colour_opts);
        const s = choose(map.style_opts) || [];

        ctx.save();
        ctx.translate(x * this.cell_w, y * this.cell_h);
        ctx.lineWidth =  this.line_width * this.width;
        ctx.setLineDash(s);
        ctx.strokeStyle = hsvts(c);
        ctx.globalAlpha = this.alpha;

        // draw a line from the middle, aligned to the flow field.
        ctx.save();
        ctx.translate(cw_h, ch_h);
        ctx.rotate(this.field.forces[x][y].f);
        // determine the line length
        let ll = 2 * this.cell_w; // 0.4 * this.cell_w; // * 0.5;
        if (ll < cw_h) ll = cw_h;

        // draw the line
        ctx.beginPath();
        ctx.moveTo(-ll, 0);
        ctx.lineTo(ll, 0);
        ctx.stroke();

        if (this.draw_head) {
          // draw a ball on the end
          const dot_size = this.line_width * 2 * this.width;
          ctx.beginPath();
          ctx.fillStyle = hsvts([180, 100, 100]);
          ctx.globalAlpha = this.alpha;
          ctx.arc(ll, 0, dot_size, 0, TAU);
          ctx.fill();
        }

        ctx.restore(); // restore the rotation
        ctx.restore(); // restore the translation.
      }
    }

    if (this.mask) {
      ctx.restore(); // go back to the pre-clip restore point
    }
  }
}

