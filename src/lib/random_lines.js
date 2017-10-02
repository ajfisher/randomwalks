'use strict';

import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
import simplex_noise from 'simplex-noise';

import { best_contrast } from './utils';

export default class RandomLines {

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
        this.segments = opts.segments || 30;
        this.padding = opts.padding || 9;

    }

    line(ctx, x_pos, colour, simplex) {

        const height = this.canvas.height;
        const y_gap = height / this.segments;

        ctx.strokeStyle = colour;
        ctx.lineWidth = 2;
        ctx.save();

        let cur_y = 0;
        ctx.translate(x_pos, cur_y);
        let x = 0;

        ctx.globalAlpha = Math.random();
        ctx.beginPath();
        ctx.moveTo(x, cur_y);
        for (let y = 1; y <= this.segments; y++ ) {
            let simplex_val = simplex.noise2D(x_pos, y);
            cur_y = y * y_gap + (simplex_val*8);
            let cur_x = x + (simplex_val*4);
            ctx.lineTo(cur_x, cur_y);
        }
        ctx.stroke();
        ctx.restore();
    }

    draw (seed) {

        if (typeof(seed) === 'undefined') {
            seed = Math.floor(Math.random() * (Math.pow(2,20)));
            console.log(seed);
        }

        Math.seedrandom(seed);

        const simplex = new simplex_noise(Math.random);

        // deal with retina DPI
        // TODO make this work for any DPI with a scalefactor
        this.canvas.height = 700 * 2;
        this.canvas.style.height = (this.canvas.height / 2) + "px";

        let ctx = this.canvas.getContext('2d');
        let palette = arrayShuffle(this.palettes)[0];
        let bg = palette[0];
        let line_colour = palette[best_contrast(palette, bg)];
        console.log(palette, bg, line_colour);

        let current_line = 0;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let x = 0; x < this.canvas.width / this.padding; x++) {
            this.line(ctx, x * this.padding, line_colour, simplex);
        }

        // put the seed on the bottom
        ctx.save();
        const txt = "#" + seed;
        ctx.font = "20px Helvetica";
        let txt_width = ctx.measureText(txt).width;
        let txt_height = parseInt(ctx.font);
        // draw bg
        ctx.fillStyle = bg;
        ctx.fillRect(5, (this.canvas.height-txt_height-10),
                txt_width+10, (txt_height+2));

        ctx.fillStyle = line_colour;
        ctx.textBaseline = 'top';
        ctx.fillText(txt, 10, this.canvas.height - (1.5*txt_height));
        ctx.restore();
    }


}

