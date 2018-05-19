'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import { best_contrast, range_map, rnd_range, sigmoid } from './utils';
export default class Drawable {

    constructor (options) {

        let opts = options || {};

        if (typeof(opts.canvas) === 'undefined') {
            throw new Error("CanvasNotDefined");
        }

        if (typeof(opts.palettes) === 'undefined') {
            throw new Error("PalettesNotDefined");
        }

        this.canvas = opts.canvas;
        this.palettes = opts.palettes;
        this.draw_queue = [];
    }

    draw(options) {
        // guides the drawing process
        // options can provide a `bg` and a `fg`

        const opts = options || {};
        let ctx = this.canvas.getContext('2d');
        const palette = this.palette;
        let bg = opts.bg || palette[0];
        let fg = opts.fg || palette[best_contrast(palette, bg)];

        // draw the background
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // put the seed on the bottom
        this.text(ctx, this.seed, bg, fg);

        //kick off the drawing queue processor.
        this.process();
    }

    init (seed, options) {
        // initialises things to get ready to draw.
        // `seed` provides a random seed as an `int` to use for recreation
        // `options` is an object
        // `neutral` is a `boolean` which if set determines whether to use
        // a palette (false or undef) or the black and white palette (true)
        // `size` is an object with `w`, `h` and `dpi` where
        // `w` and `h` are inches

        const opts = options || {};

        this.seed = parseInt(seed) || Math.floor(Math.random() * (Math.pow(2,20)));
        Math.seedrandom(this.seed);

        const {w, h, dpi} = opts.size || { w: 6.5, h: 6.5, dpi: 220};
        this.w = w;
        this.h = h;
        this.dpi = dpi;

        // deal with different DPIs
        this.canvas.height = this.h * this.dpi;
        this.canvas.width = this.w * this.dpi;

        if (typeof(this.canvas.style) != 'undefined') {
            // account for this with scale factors in browser
            this.canvas.style.height = (this.canvas.height / 2) + "px";
            this.canvas.style.width = (this.canvas.height / 2) + "px";
        }

        this.palette = arrayShuffle(this.palettes)[0];

        if (typeof(opts.neutral) != 'undefined' && opts.neutral) {
            // use b&w palette.
            this.palette = this.palettes[0];
        }
    }

    process () {
        // undertakes the processing of the draw queue

        // take the first item off the draw queue and process it
        const item = this.draw_queue.shift();

        // edge case of nothing in the queue
        if (item === undefined) {
            console.log("Nothing in the queue to process");
            return;
        }

        if (typeof(item.action.draw) != 'undefined') {
            // do a drawing action
            item.action.draw(item.context, item.colour);
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
            console.log("process complete");
        }
    }

    text(ctx, data, bg, fg) {
        // draw the text on the bottom of the image
        ctx.save();

        const txt = "#" + data;
        ctx.font = "20px Helvetica";
        let txt_width = ctx.measureText(txt).width;
        let txt_height = parseInt(ctx.font);

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
}
