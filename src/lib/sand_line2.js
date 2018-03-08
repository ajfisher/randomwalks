'use strict';

import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
import simplex_noise from 'simplex-noise';

import { best_contrast, rnd_range } from './utils';

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
    }

    pixel(ctx, x, y, colour) {

        ctx.fillStyle = colour;

        ctx.save();
        ctx.globalAlpha = 0.01;
        ctx.translate(x, y);
        ctx.fillRect(0, 0, 4, 4);
        ctx.restore();
    }


    line(ctx, x1, y1, x2, y2, colour, points, passes, line_points, volatility) {

        //const simplex = new simplex_noise(Math.random);

        // get a number of points or use all of them
        const pts = points || 100;
        const y_volatility = volatility || 700;
        const x_incr = (x2 - x1) / line_points;

        //ctx.strokeStyle = colour;
        //ctx.lineWidth = 2;

        for (let pass_no = 0; pass_no < passes; pass_no++) {


            // walk the line
            for (let x = x1; x < x2; x = x + x_incr) {

                const cx = x + rnd_range(-5, 5);
                const ny1 = rnd_range(y1, y1 - y_volatility);
                const ny2 = rnd_range(y1, y1 + y_volatility);

                // now work out how many y points to plot by dividing it up.
                const y_incr = (ny2 - ny1) / pts;

                window.requestAnimationFrame(() => {
                    ctx.save()
                    for (let p = 0; p < pts; p++) {
                        const y = ny1 + (p * y_incr);
                        this.pixel(ctx, cx, y, colour);
                    }
                    ctx.restore();
                });
            }
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

    draw (seed) {

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
        let bg = palette[0];
        let line_colour = palette[best_contrast(palette, bg)];
        //console.log(palette, bg, line_colour);

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const no_lines = 3;
        const passes = 100;
        const grains = 80;
        const line_points = this.canvas.width / 10;
        const volatility = this.canvas.height / (no_lines + 1) * 0.7;

        for (let line = 1; line <= no_lines; line++) {

            const y = this.canvas.height / (no_lines + 1) * line;

        this.line(ctx, 0, y, this.canvas.width, y, line_colour,
                    grains, passes, line_points, volatility);
        }

        // put the seed on the bottom
        this.text(ctx, this.seed, bg, line_colour);
    }
}


