'use strict';

import fs from 'fs';
import path from 'path';

import Canvas from 'canvas';
import space from 'color-space';

const palettes = require('./lib/palette.json');

import PaletteMap from './lib/palette.js';
import RandomLines from './lib/random_lines';
import RandomArcs from './lib/arcs.js';
import SandLines from './lib/sand_line2.js';
import Poly from './lib/polys.js';

let drawing = null;
let seed = undefined;

const output_dir = './output/';
let filename = '';

// call as node cli <type> [seed]

const canvas = new Canvas(1600, 1400);

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

const palettes_hsv = convert(palettes);

if (process.argv[2] === 'palette') {
  console.log('outputting palette');

  drawing = new PaletteMap({
    canvas,
    palettes: palettes_hsv
  });
} else if (process.argv[2] === 'lines') {
  console.log('Outputting lines');

  drawing = new RandomLines({
    canvas,
    palettes
  });

  seed = process.argv[3];
} else {
  console.log('Please supply an operation');
  process.exit(1);
}

// now do the drawing
drawing.draw(seed);
filename = path.resolve(output_dir, drawing.seed + '.png');
fs.writeFileSync(filename, canvas.toBuffer());

console.log(filename);
