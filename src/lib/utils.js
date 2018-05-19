'use strict';

import space from 'color-space';
import contrast from 'get-contrast';

export const hsvts = (c)  => {

    // convert first from hsv to hsl
    c = space.hsv.hsl(c);
    // now write it back as an hsl string
    return "hsl(" + c[0] + ", " + c[1] + "%, " + c[2] + "%)";
};

export const best_contrast = (palette, bg) => {
    // takes a palette and returns the index of the best colour for the background

    let best_contrast = 0;
    let c_ratio = 0;

    palette.forEach((colour, i) => {
        // do the contrast check.
        if (contrast.ratio(hsvts(bg), hsvts(colour)) > c_ratio) {
            best_contrast = i;
            c_ratio = contrast.ratio(hsvts(bg), hsvts(colour));
        }
    });

    return best_contrast;
};

export const rnd_range = (v1, v2) => {
    // takes a range of values and returns a value between them

    if (v1 % 1 === 0) {
        // int values
        // need to calculate an int version slightly differently as we want
        // to get the min and max inclusively.
        return Math.floor((Math.random() * (Math.max(v1, v2) - Math.min(v1, v2) + 1) ) + Math.min(v1, v2));
    } else {
        return (Math.random() * (Math.max(v1, v2) - Math.min(v1, v2)) ) + Math.min(v1, v2);
    }
};

export const rand_range = rnd_range;

export const sigmoid = (k=12) => {
    // create a sigmoid curve that passes through 0 and 1 bounds
    // with k dictating the flatness of the curve.
    // k:=12 by default in order to get something that more or less
    // intersects with 0..1

    if ( k <= 0) {
        k = 1;
        console.warn("K should not be below or equal to 0. Resetting to 1");
    }
    // basic sigmoid function
    // 1 / 1 + e ^ -k(x-0.5)
    // return this as a function which can be called as needed.
    return (t) => {
        return 1 / (1 + Math.exp(-k * (t - 0.5)))
    }
};

export const range_map = (l=0, u=1, v=0.5, fn) => {
    // maps a value `v` between the lower `l` and upper `u` points of the
    // range using the provided function.

    // fn is always assumed to have bounds of  0..1
    if (typeof(fn) == 'undefined') {
        // linear function
        fn = (t) => { return t / (u - l) };
    }

    // determine how far along the path you are.
    return ( l + fn(v) * (u - l) );

};

export const rescale = (sl, sh, dl, dh, v) => {
    // takes a source range `sl` and `sh` and rescales `v` to the
    // destination range `dl` and `dh`
    return ((v / (sh - sl)) * (dh-dl)) + dl;
};
