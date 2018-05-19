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

        //kick off the queue processor.
        this.process();
    }

    init (seed, options) {
        // initialises things to get ready to draw.
        // `seed` provides a random seed as an `int` to use for recreation
        // `options` is an object
        // `neutral` is a `boolean` which if set determines whether to use
        // a palette (false or undef) or the black and white palette (true)

        const opts = options || {};

        this.seed = parseInt(seed) || Math.floor(Math.random() * (Math.pow(2,20)));
        Math.seedrandom(this.seed);

        // deal with retina DPI
        // TODO make this work for any DPI with a scalefactor
        this.canvas.height = 700 * 2;
        if (typeof(this.canvas.style) != 'undefined') {
            this.canvas.style.height = (this.canvas.height / 2) + "px";
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
