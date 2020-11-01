'use strict';

import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
import simplex_noise from 'simplex-noise';

import { best_contrast } from './utils';

export default class RandomLines {
  constructor(options) {
    const opts = options || {};

    if (typeof(opts.canvas) === 'undefined') {
      throw new Error('CanvasNotDefined');
    }

    if (typeof(opts.palettes) === 'undefined') {
      throw new Error('PalettesNotDefined');
    }

    this.canvas = opts.canvas;
    this.palettes = opts.palettes;
    this.segments = opts.segments || 30;
    this.padding = opts.padding || 9;
  }

  line(ctx, x_pos, colour) {
    const simplex = new simplex_noise(Math.random);
    const height = this.canvas.height;
    const y_gap = height / this.segments;

    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;

    let cur_y = 0;

    ctx.save();
    ctx.translate(x_pos, cur_y);

    const x = 0;

    ctx.globalAlpha = Math.random();
    ctx.beginPath();
    ctx.moveTo(x, cur_y);

    for (let y = 1; y <= this.segments; y++ ) {
      const simplex_val = simplex.noise2D(x_pos, y);
      cur_y = y * y_gap + (simplex_val*8);
      const cur_x = x + (simplex_val*4);
      ctx.lineTo(cur_x, cur_y);
    }

    ctx.stroke();

    ctx.restore();
  }

  text(ctx, data, bg, fg) {
    // draw the text on the bottom of the image
    ctx.save();

    const txt = '#' + data;
    ctx.font = '20px Helvetica';
    const txt_width = ctx.measureText(txt).width;
    const txt_height = parseInt(ctx.font, 10);

    // draw bg
    ctx.fillStyle = bg;
    ctx.fillRect(5, (this.canvas.height-txt_height-10),
      txt_width+10, (txt_height+2));

    // write text
    ctx.fillStyle = fg;
    ctx.textBaseline = 'top';
    ctx.fillText(txt, 10, this.canvas.height - (1.5*txt_height));

    ctx.restore();
  }

  draw(seed) {
    this.seed = parseInt(seed, 10) || Math.floor(Math.random() * (Math.pow(2,20)));

    console.log(this.seed);
    Math.seedrandom(this.seed);

    // deal with retina DPI
    // TODO make this work for any DPI with a scalefactor
    this.canvas.height = 700 * 2;
    if (typeof(this.canvas.style) != 'undefined') {
      this.canvas.style.height = (this.canvas.height / 2) + 'px';
    }

    const ctx = this.canvas.getContext('2d');
    const palette = arrayShuffle(this.palettes)[0];
    const bg = palette[0];
    const line_colour = palette[best_contrast(palette, bg)];
    console.log(palette, bg, line_colour);

    const current_line = 0;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let x = 0; x < this.canvas.width / this.padding; x++) {
      this.line(ctx, x * this.padding, line_colour);
    }

    // put the seed on the bottom
    this.text(ctx, this.seed, bg, line_colour);
  }
}

