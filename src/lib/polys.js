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
        // `options` is an object
        // `neutral` is a `boolean` which if set determines whether to use
        // a palette (false or undef) or the black and white palette (true)

        const opts = options || {};

        this.seed = parseInt(seed) || Math.floor(Math.random() * (Math.pow(2,20)));
        Math.seedrandom(this.seed);

        super.init(seed, opts);

        let bg = this.palette[0];
        let fg = this.palette[best_contrast(this.palette, bg)];

        super.draw(seed, opts);

    }
}


