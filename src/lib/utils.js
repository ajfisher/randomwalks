'use strict';

import space from 'color-space';
import contrast from 'get-contrast';

export const convert = (palette_list) => {
  // goes through all of the palettes and converts each one to HSV
  // colour space to allow easier manipulation

  return palette_list.map((palette) => {
    return palette.map((colour) => {
      let rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
      rgb = rgb ? [
        parseInt(rgb[1], 16), parseInt(rgb[2], 16), parseInt(rgb[3], 16)
      ] : null;

      return space.rgb.hsv(rgb);
    });
  });
}

export const hsvts = (c)  => {
  // convert first from hsv to hsl
  c = space.hsv.hsl(c);
  // now write it back as an hsl string
  return 'hsl(' + Math.round(c[0]) + ', ' + Math.round(c[1]) + '%, ' + Math.round(c[2]) + '%)';
};

export const best_contrast = (palette, bg) => {
  // takes a palette in hsv format and returns the index of the best colour
  // for the background

  let top_contrast = 0;
  let c_ratio = 0;

  palette.forEach((colour, i) => {
    // do the contrast check.
    if (contrast.ratio(hsvts(bg), hsvts(colour)) > c_ratio) {
      top_contrast = i;
      c_ratio = contrast.ratio(hsvts(bg), hsvts(colour));
    }
  });

  return top_contrast;
};

export const rank_contrast = (palette) => {
  // takes a palette and returns an object with a chosen bg and rank orders
  // the remaining colours by contrast ratio.

  let best_bg = -1;

  // work out the best background
  palette.forEach((bg, i) => {
    // go through each colour as the background and check against each other
    // colour in the palette

    // console.log("New BG");
    let ratio_sum = 0;
    const best_avg_ratio = 1;

    palette.forEach((fg, j) => {
      const cr = contrast.ratio(hsvts(bg), hsvts(fg));
      // console.log(hsvts(bg), hsvts(fg), cr);
      ratio_sum = ratio_sum + cr;
    });

    // console.log("Avg ratio: ", ratio_sum / palette.length, hsvts(bg));
    if (ratio_sum / palette.length > best_avg_ratio) {
      best_bg = i;
    }
  });

  const bg = palette[best_bg];

  // now create a sorted array of fg colours by contrast
  let fg = [];

  palette.forEach((c, i) => {
    const cr = contrast.ratio(hsvts(bg), hsvts(c));

    const item = {c, cr};

    // iterate over the the fg array and insert in rank order.
    if (fg.length == 0) {
      fg.push(item);
    } else {
      let insert_ix = -1;

      fg.forEach((c_item, j) => {
        if (c_item.cr < cr) {
          insert_ix = j;
        }
      });
      // insert_ix is the index of the last index that is under current
      // constrast ratio. So we insert it after that.
      if (insert_ix + 1 == fg.length) {
        // add to the end
        fg.push(item);
      } else {
        fg.splice(insert_ix + 1, 0, item);
      }
    }
  });

  fg = fg.reverse();
  fg = fg.map((item) => {
    return item.c;
  });

  return { bg, fgs: fg };
};

export const rnd_range = (v1, v2) => {
  // takes a range of values and returns a value between them

  if (v1 % 1 === 0) {
    // int values
    // need to calculate an int version slightly differently as we want
    // to get the min and max inclusively.
    return Math.floor((Math.random() * (Math.max(v1, v2) - Math.min(v1, v2) + 1) ) + Math.min(v1, v2));
  }
  return (Math.random() * (Math.max(v1, v2) - Math.min(v1, v2)) ) + Math.min(v1, v2);
};

export const rand_range = rnd_range;

let spare = undefined;
let spare_ready = false;

export const nrand = (mean, stddev) => {
  // takes a mean and standard deviation and returns a normally distributed
  // gaussian approximation prng

  if (spare_ready) {
    spare_ready = false;
    return spare * stddev + mean;
  }

  let u;
  let v;
  let s;

  do {
    u = Math.random() * 2 - 1;
    v = Math.random() * 2 - 1;
    s = u * u + v * v;
  } while (s >= 1 || s == 0);

  const mul = Math.sqrt(-2.0 * Math.log(s) / s);
  spare = v * mul;
  spare_ready = true;
  return mean + stddev * u * mul;
};


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

export const weight_rnd = (choices, weights) => {
  // takes a set of choices and their corresponding weights and then
  // uses this to randomly pick an item from the choice array
  const total_weights = weights.reduce((sum, val) => {
    return sum + val;
  }, 0);

  let rnd = Math.floor(Math.random() * (total_weights + 1));

  for (let i = 0; i < choices.length; i++) {
    rnd = rnd - weights[i];

    if (rnd <= 0) {
      return choices[i];
    }
  }
};

export const choose = (choices) => {
  // take an array of items and chooses one of them

  const rnd = Math.floor(Math.random() * choices.length);
  return choices[rnd];
}
