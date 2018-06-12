'use strict';

import fs from 'fs';
import path from 'path';

import Canvas from 'canvas';
import program from 'commander'
import space from 'color-space';

const palettes = require('./lib/palette.json');

import PaletteMap from './lib/palette.js';
import RandomLines from './lib/random_lines';
import RandomArcs from './lib/arcs.js';
import SandLines from './lib/sand_line2.js';
import Poly from './lib/polys.js';
import DeformedQuads from './lib/deformed_quads.js';

import { convert } from './lib/utils.js';

let drawing = null;

let output_dir = './output/';
let filename = '';

// call as node cli <type> [seed]

program
  .version('0.1.0')
  .option('-t, --type [name]', '[name] of drawing type', ['dquads', 'palette', 'polys'])
  .option('-s, --seed <n>', 'Seed for the drawing', parseInt)
  .option('-w, --width <n>', 'Width of the drawing in inches', parseFloat)
  .option('-h, --height <n>', 'Height of the drawing in inches', parseFloat)
  .option('-d, --dpi <n>', 'Dots per inch for scaling', parseInt)
  .option('-n, --no <n>', 'Number of images to produce', parseInt)
  .option('--no-text', 'Remove text from the bottom of the image')
  .parse(process.argv);

let seed = program.seed || undefined;
const dtype = program.type || 'palette';
const no = program.no || 1;
const size = {
  w: program.width || 0,
  h: program.height || 0,
  dpi: program.dpi || 220
};

const show_text = program.text || false;

const canvas = new Canvas(size.w * size.dpi, size.h * size.dpi);

const palettes_hsv = convert(palettes);

if (dtype === 'palette') {
  console.log('outputting palette');

  drawing = new PaletteMap({
    canvas,
    palettes: palettes_hsv
  });
} else if (dtype === 'lines') {
  console.log('Outputting lines');

  drawing = new RandomLines({
    canvas,
    palettes
  });
} else if (dtype === 'dquads' ) {
  console.log('Outputting dquads');
  output_dir = output_dir + 'dquads/';

  drawing = new DeformedQuads({
    canvas,
    palettes: palettes_hsv,
    show_text: false
  });

  size.w = (size.w == 0) ? 6.5 : size.w;
  size.h = (size.h == 0) ? 6.5 : size.h;
} else {
  console.log('Please supply an operation');
  process.exit(1);
}

for (let d = 0; d < no; d++) {
  // now do a drawing
  if (no > 1) { seed = null }

  drawing.draw(seed, {size });
  filename = path.resolve(output_dir, drawing.seed + '.png');
  fs.writeFileSync(filename, canvas.toBuffer());

  console.log(filename);
}
