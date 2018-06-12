'use strict';

const palettes = require('./lib/palette.json');

import space from 'color-space';

import PaletteMap from './lib/palette.js';
import RandomLines from './lib/random_lines';
import RandomArcs from './lib/arcs.js';
import SandLines from './lib/sand_line2.js';
import Poly from './lib/polys.js';
import DeformedQuads from './lib/deformed_quads.js';

import Drawables from './lib';

let Canvas = null;
let random_lines = null;
let random_arcs = null;
let sand_lines = null;
let poly = null;

function convert(palette_list) {
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

let draw = {};

function init() {
  const palettes_hsv = convert(palettes);

  Canvas = document.getElementById('canv');

  console.log('initialising');

  random_lines = new RandomLines({
    canvas: Canvas,
    palettes
  });

  random_arcs = new RandomArcs({
    canvas: Canvas,
    palettes
  });

  sand_lines = new SandLines({
    canvas: Canvas,
    palettes
  });

  poly = new Poly({
    canvas: Canvas,
    palettes: palettes_hsv
  });

  draw = {
    lines: random_lines.draw.bind(random_lines),
    arcs: random_arcs.draw.bind(random_arcs),
    sand: sand_lines.draw.bind(sand_lines),
    poly: poly.draw.bind(poly)
  };

  for (const key in Drawables) {
    if (typeof(key) !== 'undefined') {
      console.log(key);
      const drawable = new Drawables[key]({
        canvas: Canvas,
        palettes: palettes_hsv
      });

      draw[key] = drawable.draw.bind(drawable);
    }
  }
}

init();

window.draw = draw;
