'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import Drawable from './drawable';

import { best_contrast, hsvts, rank_contrast, range_map, rescale, rnd_range, sigmoid } from './utils';

let canv_height = 0; // placeholder for static prop equiv

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
    }

    draw (ctx, colour) {
        // draw the rectangle

        let c = colour[0]

        // work out what colour this should be
        let h = Math.round(c[0]);
        let yh_scale = Math.round(rescale(0, canv_height, 0, 45, this.y));
        yh_scale = 0;
        //console.log(this.y, yh_scale);
        h = rnd_range(h-yh_scale, h + yh_scale);
        const s = 100, v = 100;

        ctx.fillStyle = hsvts([h, s, v]);
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillRect(this.x, this.y, this.w, this.h);
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

        Rect.config({height: this.h()});
        // add the specific drawing actions now
        let palette = this.palette;

        let { bg, fgs } = rank_contrast(palette);

        opts.bg = bg;
        opts.fg = fgs[0];
        opts.fgs = fgs;

        // draw rectangles across the screen with differing values.
        this.no_rects = rnd_range(400, 700);
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


