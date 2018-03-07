'use strict';

const palettes = require('./lib/palette.json');

import PaletteMap from './lib/palette.js';
import RandomLines from './lib/random_lines';
import RandomArcs from './lib/arcs.js';
import SandLines from './lib/sand_line2.js';


let Canvas = null;
let palette_map = null;
let random_lines = null;
let random_arcs = null;
let sand_lines = null;

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

    random_arcs = new RandomArcs({
        canvas: Canvas,
        palettes: palettes,
    });

    sand_lines = new SandLines({
        canvas: Canvas,
        palettes: palettes,
    });
}

init();
const draw = {
    palette: palette_map.draw.bind(palette_map),
    lines: random_lines.draw.bind(random_lines),
    arcs: random_arcs.draw.bind(random_arcs),
    sand: sand_lines.draw.bind(sand_lines),
};

window.draw = draw;
