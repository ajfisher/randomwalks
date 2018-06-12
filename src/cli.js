'use strict';

import fs from 'fs';
import path from 'path';

import Canvas from 'canvas';
import program from 'commander'
import space from 'color-space';

import RandomLines from './lib/random_lines';
import RandomArcs from './lib/arcs.js';
import SandLines from './lib/sand_line2.js';
import Poly from './lib/polys.js';

import Drawables from './lib';

import { convert } from './lib/utils.js';

const palettes = require('./lib/palette.json');
const palettes_hsv = convert(palettes);

const drawables_string = [];

let output_dir = './output/';
let full_file_name = '';

// get the drawables we have available in the directory
for (const key in Drawables) {
  if (typeof(key) !== 'undefined') {
    drawables_string.push(key);
  }
}
// set up the program hooks
program
  .version('0.1.0')
  .option('-t, --type [name]', '[name] of drawing type', drawables_string)
  .option('-s, --seed <n>', 'Seed for the drawing', parseInt)
  .option('--width <n>', 'Width of the drawing in inches', parseFloat)
  .option('--height <n>', 'Height of the drawing in inches', parseFloat)
  .option('--dpi <n>', 'Dots per inch for scaling', parseInt)
  .option('-n, --no <n>', 'Number of images to produce', parseInt)
  .option('--no-text', 'Remove text from the bottom of the image')
  .parse(process.argv);

let seed = program.seed || undefined;

const dtype = program.type || 'palette';
const no = program.no || 1;
const size = {
  w: program.width || 6.5,
  h: program.height || 6.5,
  dpi: program.dpi || 220
};

const show_text = program.text || false;

const canvas = new Canvas(size.w * size.dpi, size.h * size.dpi);
let drawing = null;

// based on the dtype set in, compare it to the objects available and if
// the same, we then call it.
for (const key in Drawables) {
  if (typeof(key) !== 'undefined') {
    if (key.toLowerCase() === dtype.toLowerCase()) {
      drawing = new Drawables[key]({
        palettes: palettes_hsv,
        canvas
      });
      output_dir = output_dir + drawing.name;
    }
  }
}

// essentially a catch at this point to get other drawings.
// TODO refactor these out.
if (dtype === 'lines') {
  console.log('Outputting lines');
  drawing = new RandomLines({
    canvas,
    palettes
  });
}

// if there's really nothing set then throw an error and exit
if (drawing == null) {
  console.log('Please supply an operation');
  process.exit(1);
}

// now process as many drawings as needed.
for (let d = 0; d < no; d++) {
  // now do a drawing
  if (no > 1) { seed = null }

  drawing.draw(seed, {size });

  const file_name = drawing.seed || 'default';
  full_file_name = path.resolve(output_dir, file_name + '.png');

  try {
    fs.writeFileSync(full_file_name, canvas.toBuffer());
  } catch (e) {
    if (e.code === 'ENOENT') {
      fs.mkdirSync(path.resolve(output_dir));
      fs.writeFileSync(full_file_name, canvas.toBuffer());
    } else {
      throw e;
    }
  }

  console.log(full_file_name);
}
