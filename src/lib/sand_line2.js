'use strict';

import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
import simplex_noise from 'simplex-noise';

import { best_contrast, range_map, rnd_range, sigmoid } from './utils';

const LINES = { MAX: 20, MIN: 1 };
const GRAINS = { MAX: 80, MIN: 20 };
const PASSES = { MAX: 100, MIN: 20 };

class SandPoint {
    // used to plot a specific point at x, y

    constructor (x=0, y=0, colour="#ffffff", ...opts) {

        this.x = x;
        this.y = y;
        this.colour = colour;
        this.alpha = opts[0] || 0.01;
    }

    draw (ctx) {

        ctx.fillStyle = this.colour;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.fillRect(0, 0, 4, 4);
        ctx.restore();
    }

}

class SandLine {
    // used to draw a straight line from one place to another
    constructor (x1=0, y1=0, x2=0, y2=0, points, colour="#ffffff", ...opts) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.points = points;
        this.colour = colour;

        this.alpha = opts[0] || 0.01;
    }

    draw(ctx) {
        // draws a line from (x1, y1) to (x2, y2) using the number of points
        // along the line to draw it.

        // TODO this only draws a vertical line and it should go between
        // the two points properly. This needs to get fixed.

        // based on the length of the perpendicular line, determine
        // the gaps between the points as there is always a fixed number
        // of points.
        const y_incr = (this.y2 - this.y1) / this.points;

        for (let p = 0; p < this.points; p++) {
            const y = this.y1 + (p * y_incr);
            new SandPoint(this.x1, y, this.colour, this.alpha).draw(ctx);
        }
    }
}

class SandPass {
    // this class is used for doing a pass on a particular path.

    constructor(x1, y1, x2, y2, path_points, line_points=100, volatility=700) {

        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.path_points = path_points;
        this.line_points = line_points;
        this.y_volatility = volatility;

        // determine the number of points along the x-axis needed.
        this.x_incr = (this.x2 - this.x1) / this.path_points;
    }

    draw (ctx, colour) {

        // walk the line and for each point on `x_incr` create a sandline
        // perpendicular to the direction of the path.
        for (let x = this.x1; x < this.x2; x = x + this.x_incr) {

            // jitter the x coordinate around the incremental point
            const cx = x + rnd_range(-3, 3);
            // choose points for y which come off the base y point ±
            // the amount of volatility
            const ny1 = rnd_range(this.y1, this.y1 - this.y_volatility);
            const ny2 = rnd_range(this.y1, this.y1 + this.y_volatility);

            new SandLine(cx, ny1, cx, ny2, this.line_points, colour).draw(ctx);
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
        this.lines = 0;
        this.draw_queue = [];
    }

    path(ctx, x1, y1, x2, y2, colour,
        grains=100, passes, path_points, y_volatility=100) {
        // creates a path between x1,y1 and x2,y2
        // passes establishes the number of times you need to go over the work
        // grains is the number of grains that are dropped at each point along
        // the line.
        // pass points is the number of points looked at during each pass.

        // push each pass onto the drawqueue for processing.
        for (let pass_no = 0; pass_no < passes; pass_no++) {

            this.draw_queue.push({
                action: new SandPass(x1, y1, x2, y2,
                    path_points, grains, y_volatility),
                context: ctx,
                colour: colour,
            });
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

    draw (seed, options) {
        // set off the drawing process.
        // `seed` provides a random seed as an `int` to use for recreation
        // `options` is an object
        // `neutral` is a `boolean` which if set determines whether to use
        // a palette (false or undef) or the black and white palette (true)

        const opts = options || {};

        const linestyle = opts.linestyle || "LINEAR";

        this.seed = parseInt(seed) || Math.floor(Math.random() * (Math.pow(2,20)));
        Math.seedrandom(this.seed);

        // deal with retina DPI
        // TODO make this work for any DPI with a scalefactor
        this.canvas.height = 700 * 2;
        if (typeof(this.canvas.style) != 'undefined') {
            this.canvas.style.height = (this.canvas.height / 2) + "px";
        }

        let ctx = this.canvas.getContext('2d');
        let palette = arrayShuffle(this.palettes)[0];

        if (typeof(opts.neutral) != 'undefined' && opts.neutral) {
            // use b&w palette.
            palette = this.palettes[0];
        }

        let bg = palette[0];
        let line_colour = palette[best_contrast(palette, bg)];

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // put the seed on the bottom
        this.text(ctx, this.seed, bg, line_colour);

        // now set up the number of lines.
        const no_lines = opts.lines || rnd_range(LINES.MIN, LINES.MAX);

        // set up a logistic curve to determine balance of passes to lines etc.
        const lfn = sigmoid();

        let passes = opts.passes || Math.floor(range_map(PASSES.MAX, PASSES.MIN,
            (no_lines/(LINES.MAX-LINES.MIN+1)), lfn));

        const path_points = this.canvas.width / 10;
        // do baseline volatility as a function of the number of lines
        let volatility = this.canvas.height / (no_lines + 1) * 0.7;

        let grains = opts.grains || Math.floor(volatility * 0.4);
        if (grains < GRAINS.MIN) { grains = GRAINS.MIN; }

        console.log(this.seed, no_lines, passes, grains, volatility);

        for (let line = 1; line <= no_lines; line++) {

            let y = 0;

            if (linestyle == "LINEAR") {
                y = this.canvas.height / (no_lines + 1) * line;
            } else if (linestyle == "RND_V") {
                y = rnd_range(this.canvas.height*0.05, this.canvas.height*0.95);
            }

            // add a path to be drawn
            this.path(ctx, 0, y, this.canvas.width, y, line_colour,
                grains, passes, path_points, volatility);
        }

        //kick off the queue processor.
        this.process();
    }
}


