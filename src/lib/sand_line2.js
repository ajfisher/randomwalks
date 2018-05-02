'use strict';

import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
import simplex_noise from 'simplex-noise';

import { best_contrast, rnd_range } from './utils';

class SandPoint {
    // used to determine a part of a sandline associated to a specific
    // point along the line.

    constructor (x, y, colour, ctx, ...opts) {

        this.x = x || 0;
        this.y = y || 0;
        this.colour = colour || "#ffffff";
    }

    draw (ctx) {

        ctx.fillStyle = this.colour;

        ctx.save();
        ctx.globalAlpha = 0.01;
        ctx.translate(this.x, this.y);
        ctx.fillRect(0, 0, 4, 4);
        ctx.restore();
    }

}

class SandPass {
    // this class is used for doing a pass of a particular sand line.

    constructor(x1, y1, x2, y2, pass_points, v_points=100, volatility=700) {

        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.pass_points = pass_points;
        this.v_points = v_points;
        this.y_volatility = volatility;

        // determine the number of points along the x-axis needed.
        this.x_incr = (this.x2 - this.x1) / this.pass_points;
    }

    draw (ctx, colour) {

        // walk the line
        for (let x = this.x1; x < this.x2; x = x + this.x_incr) {

            const cx = x + rnd_range(-5, 5);
            const ny1 = rnd_range(this.y1, this.y1 - this.y_volatility);
            const ny2 = rnd_range(this.y1, this.y1 + this.y_volatility);

            // now work out how many y points to plot by dividing it up.
            const y_incr = (ny2 - ny1) / this.v_points;

            ctx.save()
            for (let p = 0; p < this.v_points; p++) {
                const y = ny1 + (p * y_incr);
                new SandPoint(x, y, colour).draw(ctx);
            }
            ctx.restore();
        }

    }

}

export default class SandLines {

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
        this.lines = 4;
        this.draw_queue = [];
    }

    line(ctx, x1, y1, x2, y2, colour,
        grains=100, passes, pass_points, y_volatility=100) {
        // creates a line between x1,y1 and x2,y2
        // passes establishes the number of times you need to go over the work
        // grains is the number of grains that are droped at each point along
        // the line. 
        // pass points is the number of points looked at during each pass.

        for (let pass_no = 0; pass_no < passes; pass_no++) {

            new SandPass(x1, y1, x2, y2, pass_points, grains, y_volatility)
                .draw(ctx, colour);
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

    process () {
        // does the processing of the draw queue 

    }


    draw (seed, options) {
        // set off the drawing process.
        // `seed` provides a random seed as an `int` to use for recreation
        // `options` is an object
        // `neutral` is a `boolean` which if set determines whether to use
        // a palette (false or undef) or the black and white palette (true)

        const opts = options || {};

        this.seed = parseInt(seed) || Math.floor(Math.random() * (Math.pow(2,20)));
        Math.seedrandom(this.seed);
        console.log(this.seed);

        // deal with retina DPI
        // TODO make this work for any DPI with a scalefactor
        this.canvas.height = 700 * 2;
        if (typeof(this.canvas.style) != 'undefined') {
            this.canvas.style.height = (this.canvas.height / 2) + "px";
        }

        let ctx = this.canvas.getContext('2d');
        let palette = arrayShuffle(this.palettes)[0];

        if (typeof(opts.neutral) != 'undefined' && opts.neutral) {
            palette = this.palettes[0];
        }

        let bg = palette[0];
        let line_colour = palette[best_contrast(palette, bg)];
        //console.log(palette, bg, line_colour);

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // put the seed on the bottom
        this.text(ctx, this.seed, bg, line_colour);

        const no_lines = 1;
        const passes = 50;
        const grains = 80;
        const line_points = this.canvas.width / 10;
        const volatility = this.canvas.height / (no_lines + 1) * 0.7;

        for (let line = 1; line <= no_lines; line++) {

            const y = this.canvas.height / (no_lines + 1) * line;

            // push this onto a queue for processing.
            this.line(ctx, 0, y, this.canvas.width, y, line_colour,
                grains, passes, line_points, volatility);
        }

        // now kick off the queue process.
        //window.requestAnimationFrame(() => this.process);
    }
}


