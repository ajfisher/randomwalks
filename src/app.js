'use strict';

// const palettes = require('./lib/palette.json');
import palettes from './lib/palette.json';

import space from 'color-space';

import RandomLines from './lib/random_lines';
import RandomArcs from './lib/arcs.js';
import SandLines from './lib/sand_line2.js';
import Poly from './lib/polys.js';

import Drawables from './lib';
import { convert } from './lib/utils.js';

let Canvas = null;
let random_lines = null;
let random_arcs = null;
let sand_lines = null;
let poly = null;

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
