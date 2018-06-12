'use strict';

import { best_contrast, hsvts } from './utils';

class PaletteMap {
  // draws a map of each of the palettes available and chooses the
  // chooses the best contrast colour against the default background

  constructor(options) {
    const opts = options || {};

    if (typeof(opts.canvas) === 'undefined') {
      throw new Error('CanvasNotDefined');
    }

    if (typeof(opts.palettes) === 'undefined') {
      throw new Error('PalettesNotDefined');
    }

    this.name = 'palette';
    this.canvas = opts.canvas;
    this.palettes = opts.palettes;
    this.rows = opts.rows || 10;
    this.cols = this.palettes.length / this.rows;
    this.padding = 5;
  }

  draw() {
    // draw the palettes out.
    this.canvas.height = 0.5 * this.canvas.width;
    // deal with retina displays
    if (typeof(this.canvas.style) !== 'undefined') {
      this.canvas.style.height = (this.canvas.height) / 2 + 'px';
    }

    const width = this.canvas.width;
    const height = this.canvas.height;

    const palette_h = (height + this.padding) / this.rows;
    const palette_w = (width + this.padding) / this.cols;
    const tile_h = palette_h - this.padding;
    const tile_w = (palette_w - this.padding) / this.palettes[0].length;

    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    this.palettes.forEach((palette, i) => {
      const col = Math.floor(i % this.cols);
      const row = Math.floor(i / this.cols);

      const x = col * palette_w;
      const y = row * palette_h;

      ctx.save();
      ctx.translate(x, y);

      const bg = palette[0];

      palette.forEach((colour, j) => {
        const tile_x = j * tile_w;
        ctx.fillStyle = hsvts(colour);
        ctx.fillRect(tile_x, 0, tile_w, tile_h);
      });

      // draw the strip horizontally for the contrast strip.
      ctx.fillStyle = palette[best_contrast(palette, palette[0])];
      ctx.fillRect(0, (0.5*tile_h) - (0.5*tile_w),
        palette_w-this.padding, tile_w);

      ctx.restore();
    });
  }
}

export default PaletteMap;
