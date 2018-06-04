'use strict';

const palettes = require('./lib/palette.json');

import space from 'color-space';

import PaletteMap from './lib/palette.js';
import RandomLines from './lib/random_lines';
import RandomArcs from './lib/arcs.js';
import SandLines from './lib/sand_line2.js';
import Poly from './lib/polys.js';

let Canvas = null;
let palette_map = null;
let random_lines = null;
let random_arcs = null;
let sand_lines = null;
let poly = null;

function convert(palettes) {
    // goes through all of the palettes and converts each one to HSV
    // colour space to allow easier manipulation

    return palettes.map((palette) => {
        return palette.map((colour) => {

            let rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
            rgb = rgb ? [
                parseInt(rgb[1], 16), parseInt(rgb[2], 16), parseInt(rgb[3], 16)
            ] : null;

            return space.rgb.hsv(rgb);
        });
    });
}


function init() {

    let palettes_hsv = convert(palettes);

    Canvas = document.getElementById("canv");

    console.log("initialising");
    palette_map = new PaletteMap({
        canvas: Canvas,
        palettes: palettes_hsv,
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

    poly = new Poly({
        canvas: Canvas,
        palettes: palettes_hsv,
    });
}

init();
const draw = {
    palette: palette_map.draw.bind(palette_map),
    lines: random_lines.draw.bind(random_lines),
    arcs: random_arcs.draw.bind(random_arcs),
    sand: sand_lines.draw.bind(sand_lines),
    poly: poly.draw.bind(poly),
};

window.draw = draw;
