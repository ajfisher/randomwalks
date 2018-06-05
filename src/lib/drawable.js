'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import { best_contrast, hsvts, range_map, rnd_range, sigmoid } from './utils';
export default class Drawable {
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
    this.draw_queue = [];
  }

  enqueue(action, colour='#ffffff') {
    // takes an action and then puts it onto the draw queue.

    if (typeof(action) === 'undefined') {
      throw Error('Queue must take an action');
    }

    this.draw_queue.push({
      action,
      colour
    });
  }
  execute(options) {
    // executes the drawing process
    // options can provide a `bg` and a `fg`

    const opts = options || {};

    this.ctx = this.canvas.getContext('2d');

    const palette = this.palette;
    this.bg = opts.bg || palette[0];
    this.fg = opts.fg || palette[best_contrast(palette, this.bg)];
    this.fgs = opts.fgs || palette;

    // draw the background
    this.ctx.fillStyle = hsvts(this.bg);
    this.ctx.fillRect(0, 0, this.w(), this.h());

    // print the seed to the console for use
    console.log(this.seed);

    // kick off the drawing queue processor.
    this.process();
  }

  init(options) {
    // initialises things to get ready to draw.
    // `options` is an object
    // `neutral` is a `boolean` which if set determines whether to use
    // a palette (false or undef) or the black and white palette (true)
    // `size` is an object with `w`, `h` and `dpi` where
    // `w` and `h` are inches

    const opts = options || {};

    if (this.seed === null) {
      // choose a random seed to use
      this.seed = Math.floor(Math.random() * (Math.pow(2,20)));
    }

    // kick off the PRNG
    Math.seedrandom(this.seed);

    // get the size to make the image
    const {w, h, dpi} = opts.size || { w: 6.5, h: 6.5, dpi: 220};
    this.width = w;
    this.height = h;
    this.dpi = dpi;
    this.scale_factor = 1.0;

    // deal with different DPIs
    this.canvas.height = this.height * this.dpi;
    this.canvas.width = this.width * this.dpi;

    if (typeof(this.canvas.style) != 'undefined') {
      // account for this with scale factors in browser
      this.scale_factor = 2.0;
      this.canvas.style.height = (this.canvas.height / this.scale_factor) + 'px';
      this.canvas.style.width = (this.canvas.height / this.scale_factor) + 'px';
    }

    this.palette = arrayShuffle(this.palettes)[0];

    if (typeof(opts.neutral) != 'undefined' && opts.neutral) {
      // use b&w palette.
      this.palette = this.palettes[0];
    }
  }

  process() {
    // undertakes the processing of the draw queue

    // take the first item off the draw queue and process it
    const item = this.draw_queue.shift();

    // edge case of nothing in the queue
    if (item === undefined) {
      console.log('Nothing in the queue to process');
      return;
    }

    if (typeof(item.action.draw) != 'undefined') {
      // do a drawing action
      item.action.draw(this.ctx, item.colour);
    } else {
      // process the action in place.
    }

    if (this.draw_queue.length > 0) {
      // deal with if we're working in browser or not.
      if (window) {
        window.requestAnimationFrame(() => this.process());
      } else {
        this.process();
      }
    } else {
      // we're done so wind it up.

      // put the seed on the bottom
      this.text(this.ctx, this.seed, this.bg, this.fg);

      console.log('process complete');
    }
  }

  text(ctx, data, bg, fg) {
    // draw the text on the bottom of the image
    //
    ({fg, bg} = this);
    ctx.save();

    const txt = '#' + data;
    ctx.font = this.h(0.015) + 'px Helvetica'; // 1.5% of height of canvas
    const txt_w = ctx.measureText(txt).width;
    const txt_h = parseInt(ctx.font, 10);
    // work out the gutters relative to the text height as reference point
    const gx = 0.25 * txt_h;
    const gy = 0.5 * txt_h

    // draw bg
    ctx.fillStyle = hsvts(bg);
    ctx.fillRect(gx, this.h()-txt_h-gy, txt_w+(2*gx), txt_h+gx);

    // write text
    ctx.fillStyle = hsvts(fg);
    ctx.textBaseline = 'top';
    ctx.fillText(txt, gx*2, this.h() - (1.5*txt_h));

    ctx.restore();
  }

  // various helper functions
  //

  // transforms a percentage to concrete pixel value
  // default to 100% to cope with empty requests
  h(v=1.0) { return v * this.height * this.dpi; }
  w(v=1.0) { return v * this.width * this.dpi;  }
}
