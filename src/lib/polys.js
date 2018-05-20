'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import Drawable from './drawable';

import { best_contrast, hsvts, rank_contrast, range_map, rescale, rnd_range, weight_rnd } from './utils';

let canv_height = 0; // placeholder for static prop equiv
let canv_width = 0;
const colour_weights = [10, 5, 2, 1, 1];

class Rect {
    // builds a simple rectangle on the screen

    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    static config (options) {

        let opts = options || {};

        canv_height = opts.height;
        canv_width = opts.width;
    }

    draw (ctx, colours) {
        // draw the rectangle

        let weights = colour_weights.slice(0);
        while(colours.length < weights.length) {
            weights.pop();
        }
        // scale weight of 2nd and 3rd value based on x & y value
        weights[1] = rnd_range(weights[1],
            rescale(0, canv_width, weights[1], weights[1]+25, this.x));
        weights[2] = rnd_range(weights[2],
            rescale(0, canv_height, weights[2], weights[2]+25, this.y));

        let c = weight_rnd(colours, weights);

        // work out what hue this should be
        let h = Math.round(c[0]);
        //let yh_scale = Math.round(rescale(0, canv_height, 0, 15, this.y));
        let xa = 1.0 - rescale(0, 0.05*canv_width*canv_height, 0.5, 0.99, this.w * this.h);
        //console.log(this.w * this.h, xa);
        let rot = rescale(0, canv_height, 0, 90, this.y);
        rot = rnd_range(0.01, rot);

        //yh_scale = 0;
        //console.log(this.y, yh_scale);
        //h = rnd_range(h-yh_scale, h + yh_scale);
        const s = c[1], v = c[2];
        //const s = 100, v = 100;

        ctx.fillStyle = hsvts([h, s, v]);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(rot * Math.PI / 180);
        ctx.globalAlpha = Math.abs(xa); //rnd_range(0.05, Math.abs(xa));
        ctx.fillRect(0, 0, this.w, this.h);
        ctx.restore();
    }
}

export default class Poly extends Drawable {

    constructor (options) {

        super(options);

        let opts = options || {};
    }

    draw (seed, options) {
        // set off the drawing process.
        // `seed` provides a random seed as an `int` to use for recreation
        // `options` is an object which is inherited from `super` and
        // then any other options specific

        this.seed = parseInt(seed) || null;
        const opts = options || {};

        // prep the object with all the base conditions
        super.init(opts);

        Rect.config({height: this.h(), width: this.w()});
        // add the specific drawing actions now
        let palette = this.palette;

        let { bg, fgs } = rank_contrast(palette);

        opts.bg = bg;
        opts.fg = fgs[0];
        opts.fgs = fgs;

        // draw rectangles across the screen with differing values.
        this.no_rects = rnd_range(300, 600);
        console.log(this.no_rects);
        for (let i = 0; i < this.no_rects; i++) {

            // get some values
            const x = rnd_range(-0.1, 1.0);
            const y = rnd_range(-0.1, 1.0);
            const w = rnd_range(0.01, 0.2);
            const h = rnd_range(0.01, 0.3);

            this.enqueue(
                new Rect(this.w(x), this.h(y), this.w(w), this.h(h)),
                opts.fgs,
            );
        }

        // now execute the drawing.
        super.execute(opts);

    }
}


