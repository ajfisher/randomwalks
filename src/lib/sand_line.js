'use strict';

import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
import simplex_noise from 'simplex-noise';

import { best_contrast, rnd_range } from './utils';

export default class SandLines {
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
    this.lines = 4;
  }

  pixel(ctx, x, y, colour) {
    ctx.fillStyle = colour;

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.translate(x, y);
    ctx.fillRect(0, 0, 1, 1);
    ctx.restore();
  }


  line(ctx, x1, y1, x2, y2, colour, points) {
    // const simplex = new simplex_noise(Math.random);

    // get a number of points or use all of them
    const pts = points || 100;

    // ctx.strokeStyle = colour;
    // ctx.lineWidth = 2;

    ctx.save();

    // walk the line
    for (let x = x1; x < x2; x++) {
      // console.log(x, pts)
      const ny1 = rnd_range(y1-150, y1);
      const ny2 = rnd_range(y1, y1+150);
      // now plot points at random Y points off the line.
      for (let p = 0; p < pts; p++) {
        const y = rnd_range(ny1, ny2);
        this.pixel(ctx, x, y, colour);
      }
    }

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
    Math.seedrandom(this.seed);
    console.log(this.seed);

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

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const grains = 100;
    this.line(ctx, this.canvas.width * 0.05, this.canvas.height * 0.5,
      this.canvas.width * 0.95, this.canvas.height * 0.5, line_colour, grains);

    this.line(ctx, this.canvas.width * 0.05, this.canvas.height * 0.25,
      this.canvas.width * 0.95, this.canvas.height * 0.25, line_colour, grains);
    this.line(ctx, this.canvas.width * 0.05, this.canvas.height * 0.75,
      this.canvas.width * 0.95, this.canvas.height * 0.75, line_colour, grains);
    // put the seed on the bottom
    this.text(ctx, this.seed, bg, line_colour);
  }
}


