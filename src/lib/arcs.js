'use strict';

import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import { best_contrast } from './utils';

const primes = [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41];

export default class RandomArcs {

    constructor(options) {

        let opts = options || {};

        if (typeof(opts.canvas) === 'undefined') {
            throw new Error("CanvasNotDefined");
        }

        if (typeof(opts.palettes) === 'undefined') {
            throw new Error("PalettesNotDefined");
        }

        this.canvas = opts.canvas;
        this.palettes = opts.palettes;


    }

    rnd_prime(limit) {
        // gets one of the primes up to the limit provided. If no limit
        // given then it will return up to the limit of the primes array

        let l = limit || primes.length;

        return ( primes[Math.floor(Math.random() * l)] );
    }

    arc(ctx, centre, radius, colour) {
        // draws an arc to the screen

        ctx.save()
        ctx.translate(centre.x, centre.y);

        ctx.strokeStyle = colour;
        ctx.lineWidth = this.rnd_prime(6);
        ctx.globalAlpha = Math.random();

        ctx.beginPath();
        const from_angle = this.rnd_prime() / this.rnd_prime();
        const to_angle = this.rnd_prime() / this.rnd_prime();
        //console.log("arc: ", radius, from_angle, to_angle, ctx.globalAlpha, colour);

        ctx.arc(0, 0, radius, from_angle, to_angle);
        ctx.stroke();

        ctx.restore();
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

        console.log(this.seed);
        Math.seedrandom(this.seed);

        // deal with retina DPI
        // TODO make this work for any DPI with a scalefactor
        this.canvas.height = 700 * 2;
        if (typeof(this.canvas.style) != 'undefined') {
            this.canvas.style.height = (this.canvas.height / 2) + "px";
        }

        let centre = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
        };

        let ctx = this.canvas.getContext('2d');
        let palette = arrayShuffle(this.palettes)[0];
        let bg = palette[0];
        let fg = palette[best_contrast(palette, bg)];
        console.log(palette, bg, fg);

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const arcs = this.rnd_prime(10) * this.rnd_prime(6);

        for (let i = 0; i < arcs; i++ ) {
            const arc_fg = palette[Math.floor(Math.random() * (palette.length -1)) + 1];
            this.arc(ctx, centre, (this.rnd_prime(10) * this.rnd_prime(10)), arc_fg);
        }
        // put the seed on the bottom
        this.text(ctx, this.seed, bg, fg);
    }

}
