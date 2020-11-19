'use strict';

// Holds all of the drawing utility functions that get exported and used
// around the application.

import contrast from 'get-contrast';
import space from 'color-space';

export const EGGSHELL = [47, 6, 100];

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
