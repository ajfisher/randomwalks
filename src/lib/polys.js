'use strict';

import space from 'color-space';
import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';

import Drawable from './drawable';

import { best_contrast, range_map, rnd_range, sigmoid } from './utils';

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

        // now execute the drawing.
        super.execute(opts);

    }
}


