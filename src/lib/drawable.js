'use strict';

import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import { best_contrast, hsvts } from './utils';

export default class Drawable {
  constructor(options) {
    const opts = options || {};

    if (typeof(opts.canvas) === 'undefined') {
      throw new Error('CanvasNotDefined');
    }

    if (typeof(opts.palettes) === 'undefined') {
      throw new Error('PalettesNotDefined');
    }

    if (typeof(opts.name) === 'undefined') {
      throw new Error('Drawable name not defined');
    }

    this.name = opts.name || '';
    this.canvas = opts.canvas;
    this.palettes = opts.palettes;
    this.border = opts.border || 0;

    // have to do it this way due to sending a false will always || to true
    this.show_text = (typeof(opts.show_text) == 'undefined') ? true : opts.show_text;
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
    // `border` is the proportion of the canvas to be given as a border.

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

    this._border = this.w(this.border); // pixel value of the border.

    // sort out the palettes
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

    this.ctx.save();
    if (this.border > 0) {
      // create clipping path for the border
      const { border, _border } = this;

      // note that it's possible to add additional clipping points in here
      // this is very handy. The default is to apply a border to the outside
      // of the image. But others are possible.
      this.ctx.beginPath()
      this.ctx.rect(_border, _border, this.w(1.0-2*border), this.h(1.0-2*border));
      this.ctx.clip();
      /** leaving all of this in here because it's super useful.
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.moveTo(this.w(0.5), this.h(0.05));
      ctx.lineTo(this.w(0.95), this.h(0.95));
      ctx.lineTo(this.w(0.05), this.h(0.95));
      ctx.lineTo(this.w(0.5), this.h(0.05));
      ctx.moveTo(this.w(0.5), this.h(0.95));
      ctx.lineTo(this.w(0.05), this.h(0.05));
      ctx.lineTo(this.w(0.95), this.h(0.05));
      ctx.lineTo(this.w(0.5), this.h(0.95));
      ctx.clip();
      this.ctx.beginPath();
      this.ctx.arc(this.w(0.3), this.h(0.3), this.w(0.25), 0, Math.PI*2);
      this.ctx.moveTo(this.w(0.8), this.h(0.7));
      this.ctx.arc(this.w(0.8), this.h(0.5), this.w(0.1), 0, Math.PI*2);
      this.ctx.moveTo(this.w(0.6), this.h(0.7));
      this.ctx.arc(this.w(0.6), this.h(0.7), this.w(0.15), 0, Math.PI*2);
      // this.ctx.rect(0, _border, this.w(), this.h(0.1));
      // this.ctx.rect(0, this.h(0.152), this.w(), this.h(0.1));
      // this.ctx.rect(0, this.h(0.755), this.w(), this.h(0.1));
      this.ctx.clip();
      **/
    }

    if (typeof(item.action.draw) != 'undefined') {
      // do a drawing action
      item.action.draw(this.ctx, item.colour);
    } else {
      // process the action in place.
    }

    if (this.draw_queue.length > 0) {
      // deal with if we're working in browser or not.
      if (typeof(window) !== 'undefined') {
        window.requestAnimationFrame(() => this.process());
      } else {
        this.process();
      }
    } else {
      // we're done so wind it up.

      if (this.show_text) {
        // put the seed on the bottom
        this.ctx.restore();
        this.text(this.ctx, this.seed, this.bg, this.fg);
      }

      // let the user know when the process is finished if it's in browser
      if (typeof(window) !== 'undefined') {
        console.log('process complete');
      }
    }

    this.ctx.restore();
  }

  text(ctx, data, bg, fg) {
    // draw the text on the bottom of the image
    //
    ({fg, bg} = this);
    ctx.save();

    ctx.globalAlpha = 1.0;
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
  // takes a number of centimeters and gives an approximation of pixels
  // back.
  cm(v=1.0) { return Math.round(v * this.dpi / 2.54); }
}
