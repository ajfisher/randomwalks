'use strict';

import fs from 'fs';
import path from 'path';

const palettes = require('./lib/palette.json');

import PaletteMap from './lib/palette.js';
import RandomLines from './lib/random_lines';
import Canvas from 'canvas';

let palette_map = null;
let random_lines = null;

let output_dir = "./output/";
let filename = '';

/**function init() {

    console.log("initialising");

}**/

//init();

/**const draw = {
    palette: palette_map.draw.bind(palette_map),
    lines: random_lines.draw.bind(random_lines),
};**/

// call as node cli <type> <seed>

if (process.argv[2] === "palette") {
    console.log("outputting palette");

    let canvas = new Canvas(1600, 1400);

    palette_map = new PaletteMap({
        canvas: canvas,
        palettes: palettes,
    });

    palette_map.draw();

    filename = path.resolve(output_dir, "palette.png");

    fs.writeFileSync(filename, canvas.toBuffer());

} else if (process.argv[2] === "lines") {

    console.log("Outputting lines");
    random_lines = new RandomLines({
        canvas: Canvas,
        palettes: palettes,
    });

    filename = path.resolve(output_dir,"lines.png");
} else {
    console.log("Please supply an operation");
}

console.log(filename);
