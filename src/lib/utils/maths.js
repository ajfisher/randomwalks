'use strict';

// this module is used to hold a bunch of general maths functions that
// are useful utilities

export const constrain = (v, range) => {
  // takes an array in `range` and then constrains `v` to
  // that range

  const min = Math.min(range[0], range[1]);
  const max = Math.max(range[0], range[1]);

  if (v < min) {
    return min;
  }

  if (v > max) {
    return max;
  }

  return v;
}

export const sigmoid = (k=12) => {
  // create a sigmoid curve that passes through 0 and 1 bounds
  // with k dictating the flatness of the curve.
  // k:=12 by default in order to get something that more or less
  // intersects with 0..1

  if ( k <= 0) {
    k = 1;
    console.warn('K should not be below or equal to 0. Resetting to 1');
  }
  // basic sigmoid function
  // 1 / 1 + e ^ -k(x-0.5)
  // return this as a function which can be called as needed.
  return (t) => {
    return 1 / (1 + Math.exp(-k * (t - 0.5)))
  }
};

/**
 * Maps the given value between the lower and upper bound to a function to
 * determine distance along that domain.
 *
 * @namespace
 * @function
 *
 * @param {Number=} l - The lower bound of the range
 * @param {Number=} u - The upper bound of the range
 * @param {Number=} v - The value to map
 * @param {Function=} fn - A function to do the mapping. Defaults to linear interpolation
 *
 * @returns {Number} Mapped value is returned indicating how far along the path the value is.
 */
export const range_map = (l=0, u=1, v=0.5, fn) => {
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
  return dl + ( ((v - sl) * (dh - dl)) / (sh - sl) )
};

