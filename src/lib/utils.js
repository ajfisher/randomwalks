'use strict';

//const contrast = require('wcag-contrast');

import contrast from 'wcag-contrast';

export const best_contrast = (palette, bg) => {
    // takes a palette and returns the index of the best colour for the background
    let best_contrast = 0;
    let c_ratio = 0;
    palette.forEach((colour, i) => {
        // do the contrast check.
        if (contrast.hex(bg, colour) > c_ratio) {
            best_contrast = i;
            c_ratio = contrast.hex(bg, colour);
        }
    });

    return best_contrast;
};

export const rnd_range = (v1, v2) => {
    return Math.floor(Math.random() * (Math.max(v1, v2) - Math.min(v1, v2) + 1) ) + Math.min(v1, v2);
};

