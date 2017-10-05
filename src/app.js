'use strict';

const palettes = require('./lib/palette.json');

import PaletteMap from './lib/palette.js';
import RandomLines from './lib/random_lines';

let Canvas = null;
let palette_map = null;
let random_lines = null;

function init() {

    Canvas = document.getElementById("canv");

    console.log("initialising");
    palette_map = new PaletteMap({
        canvas: Canvas,
        palettes: palettes,
    });

    random_lines = new RandomLines({
        canvas: Canvas,
        palettes: palettes,
    });
}

init();
const draw = {
    palette: palette_map.draw.bind(palette_map),
    lines: random_lines.draw.bind(random_lines),
};

window.draw = draw;
