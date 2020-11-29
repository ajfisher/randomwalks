import EventEmitter from 'events';

import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import { best_contrast, hsvts } from './utils.js';

/**
 * An abstract class that sets up the drawing queue to draw
 * @class
 * @category Drawable
 */
export class Drawable extends EventEmitter {
  /**
   * Construct the Drawable
   * @constructor
   * @param {Object=} options - The options object for this drawable
   */
  constructor(options) {
    const opts = options || {};
    super(opts);

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
    this.texture = opts.texture || false;
    this.predraw = opts.predraw || false;
    this.palettes = opts.palettes;
    this.border = opts.border || 0;

    // have to do it this way due to sending a false will always || to true
    this.show_text = (typeof(opts.show_text) == 'undefined') ? true : opts.show_text;
    this.draw_queue = [];

    // determine if we're running the test suite or not.
    this.IS_TEST = false;
    if (typeof(process) !== 'undefined') {
      if (process.env.IS_TEST) {
        this.IS_TEST = true;
      }
    }
  }

  /**
   * Take an {@link Actionable} and put it onto the draw queue
   * @param {Actionable} action - The action to add to the queue
   * @param {Colour=} colour - the base colour to use for this action
   *
   */
  enqueue(action, colour='#ffffff') {
    if (typeof(action) === 'undefined') {
      throw Error('Queue must take an action');
    }

    this.draw_queue.push({
      action,
      colour
    });
  }

  /**
   * Executes the drawing process
   *
   * @param {Object} options - the Options to pass into this execution
   */
  execute(options) {
    // executes the drawing process
    // options can provide a `bg` and a `fg`

    const opts = options || {};

    this.ctx = this.canvas.getContext('2d');
    // get the texture / noise canvas
    if (this.texture) {
      this.tx_ctx = this.texture.getContext('2d');
    }
    if (this.predraw) {
      this.pd_ctx = this.predraw.getContext('2d');
    }

    const palette = this.palette;
    this.bg = opts.bg || palette[0];
    this.fg = opts.fg || palette[best_contrast(palette, this.bg)];
    this.fgs = opts.fgs || palette;

    // draw the background
    this.ctx.fillStyle = hsvts(this.bg);
    this.ctx.fillRect(0, 0, this.w(), this.h());

    // print the seed to the console for use
    if (! this.IS_TEST) {
      console.log(this.seed);
    }

    // kick off the drawing queue processor.
    this.process();
  }

  /**
   * Initialise the drawing ready for drawing.
   *
   * @param {Object} options - A set of Drawing Initialisation options
   * @param {Boolean=} options.neutral - if not set or false, use the palette, if true, use black and white
   * @param {Object=} options.size - The size settings for this drawing
   * @param {Number} options.size.w - The width of the output image in inches
   * @param {Number} options.size.h - The height of the output image in inches
   * @param {Number} options.size.dpi - The dots per inch resolution of the image
   * @param {Number} options.border - The proportion (0..1) of the canvas to use as a border
   * @param {Number=} options.border_cm - An actual cm size for the canvas border.
   *
   */
  init(options={}) {
    const opts = options;

    if (this.seed === null) {
      // choose a random seed to use
      this.seed = Math.floor(Math.random() * (Math.pow(2,20)));
    }

    // kick off the PRNG
    seedrandom(this.seed, {global: true});

    // get the size to make the image
    const {w, h, dpi, border, border_cm} = opts.size ||
      { w: 6.5, h: 6.5, dpi: 220, border: 0, border_cm: undefined};
    this.width = w;
    this.height = h;
    this.dpi = dpi;
    this.scale_factor = 1.0;
    this.border = border || this.border;
    this.border_cm = border_cm || undefined;

    // deal with different DPIs
    this.canvas.height = this.height * this.dpi;
    this.canvas.width = this.width * this.dpi;

    if (this.texture) {
      this.texture.height = this.canvas.height;
      this.texture.width = this.canvas.width;
    }

    if (this.predraw) {
      this.predraw.height = this.canvas.height;
      this.predraw.width = this.canvas.width;
    }

    if (typeof(this.canvas.style) != 'undefined') {
      // account for this with scale factors in browser
      this.scale_factor = 2.0;
      this.canvas.style.height = (this.canvas.height / this.scale_factor) + 'px';
      this.canvas.style.width = (this.canvas.width / this.scale_factor) + 'px';

      this.texture.style.height = (this.texture.height / this.scale_factor) + 'px';
      this.texture.style.width = (this.texture.width / this.scale_factor) + 'px';
      this.predraw.style.height = (this.predraw.height / this.scale_factor) + 'px';
      this.predraw.style.width = (this.predraw.width / this.scale_factor) + 'px';
    }

    if (typeof(this.border) != 'undefined') {
      this._border = this.w(this.border); // pixel value of the border width.
    }

    if (typeof(this.border_cm) != 'undefined') {
      this._border = this.cm(this.border_cm); // pixel value of border width;
    }

    // sort out the palettes
    this.palette = arrayShuffle(this.palettes)[0];

    if (typeof(opts.neutral) != 'undefined' && opts.neutral) {
      // use b&w palette.
      this.palette = this.palettes[0];
    }
  }

  /**
   * Undertake the processing of the draw queue
   */
  process() {
    // take the first item off the draw queue and process it
    const item = this.draw_queue.shift();

    // edge case of nothing in the queue
    if (item === undefined) {
      console.log('Nothing in the queue to process');
      return;
    }

    this.ctx.save();
    if (this._border > 0) {
      // create clipping path for the border
      const { _border } = this;

      // note that it's possible to add additional clipping points in here
      // this is very handy. The default is to apply a border to the outside
      // of the image. But others are possible.
      this.ctx.beginPath()
      this.ctx.rect(_border, _border, this.w()-2*_border, this.h()-2*_border);
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
      item.action.draw(this.ctx, item.colour, this.tx_ctx, this.pd_ctx);
    } else {
      // process the action in place.
    }

    if (this.draw_queue.length > 0) {
      // deal with if we're working in browser or not.
      if (typeof(window) !== 'undefined') {
        window.requestAnimationFrame(() => this.process());
      } else {
        if (! this.IS_TEST) {
          console.log('processing frame: ' + this.draw_queue.length);
        }
        setTimeout((o) => {
          o.process();
        }, 1, this);
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
      } else {
        this.emit('completed');
      }
    }

    this.ctx.restore();
  }

  /**
   * Draw the seed value text on the bottom of the image
   *
   * @param {Context2D} ctx - The 2D canvas context to draw to.
   * @param {String} data - The data to write
   * @param {Colour} bg - The background colour
   * @param {Colour} fg - The foreground colour of the text
   *
   */
  text(ctx, data, bg, fg) {
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

  /**
   * Transform a proportional height to a concrete pixel value of the canvas
   *
   * @param {Number} v - Proportion of the canvas height you want 0..1
   *
   * @returns {Number} The pixel value of that proportion
   */
  h(v=1.0) { return v * this.height * this.dpi; }
  /**
   * Transform a proportional width to a concrete pixel value of the canvas
   *
   * @param {Number} v - Proportion of the canvas width you want 0..1
   *
   * @returns {Number} The pixel value of that proportion
   */
  w(v=1.0) { return v * this.width * this.dpi;  }
  /**
   * Takes a number of centimeters and gives an approximation of pixels back.
   *
   * @param {Number} v - Number of centimeters you want to convert into pixels
   * @returns {Number} The number of pixels represented in that cm value
   */
  cm(v=1.0) { return Math.round(v * this.dpi / 2.54); }

  /**
   * Clear out the canvas
   *
   * @param {Canvas} canv - the canvas object to clear out
   * @param {Context2D} ctx - The context object of the canvas
   */
  clear(canv, ctx) { ctx.clearRect(0,0, canv.width, canv.height); }
}

// Export the class as the default export. Do it this way to be explicit
// and also not mess up JSDOC.
export default Drawable;
