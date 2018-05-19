'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import Drawable from './drawable';

import { best_contrast, hsvts, range_map, rnd_range, sigmoid } from './utils';

class Rect {
    // builds a simple rectangle on the screen

    constructor(x, y, w, h) {

        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

    }

    draw (ctx, colour) {

        // work out what colour this should be

        ctx.fillStyle = hsvts(colour);
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

        // add the specific drawing actions now
        let palette = this.palette;

        opts.bg = palette[0];
        opts.fg = palette[best_contrast(palette, opts.bg)];

        // draw rectangles across the screen with differing values.
        this.no_rects = rnd_range(1000, 2000);
        console.log(this.no_rects);
        for (let i = 0; i < this.no_rects; i++) {

            // get some values
            const x = rnd_range(0.0001, 0.9);
            const y = rnd_range(0.0001, 0.9);
            const w = rnd_range(0.01, 0.2);
            const h = rnd_range(0.01, 0.1);

            this.enqueue(
                new Rect(this.w(x), this.h(y), this.w(w), this.h(h)),
                opts.fg,
            );
        }

        // now execute the drawing.
        super.execute(opts);

    }
}


