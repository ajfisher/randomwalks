'use strict';

import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
const simplex_noise = require('simplex-noise');

const palettes = require('./lib/palette.json');

import PaletteMap from './lib/palette.js';

let Canvas = null;
let palette_map = null;

let width, height;

//Math.seedrandom('hithere');

function init() {

    if (window) {
        Canvas = document.getElementById("canv");

    } else {
    //    let Canvas = require('canvas');
    }

    window._palettes = palettes;

    console.log("initialising");
    palette_map = new PaletteMap({
        canvas: Canvas,
        palettes: palettes,
    });
}

function draw_lines (seed) {

    if (typeof(seed) === 'undefined') {
        seed = Math.floor(Math.random() * (Math.pow(2,20)));
        console.log(seed);
    }

    Math.seedrandom(seed);

    const simplex = new simplex_noise(Math.random);

    Canvas.height = 700 * 2; // deal with retina;
    Canvas.style.height = (Canvas.height / 2) + "px"; // deal with retina;

    let ctx = Canvas.getContext('2d');
    let palette = arrayShuffle(palettes)[0];
    let bg = palette[0];
    let line_colour = palette[best_contrast(palette, bg)];
    console.log(palette, bg, line_colour);

    const padding = 9;
    const segments = 30;
    height = Canvas.height;
    width = Canvas.width;

    const y_gap = height / segments;

    let current_line = 0;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);


    function draw_line(x_pos) {
        ctx.strokeStyle = line_colour;
        ctx.lineWidth = 2;
        ctx.save();

        let cur_y = 0;
        ctx.translate(x_pos, cur_y);
        let x = 0;

        ctx.globalAlpha = Math.random();
        ctx.beginPath();
        ctx.moveTo(x, cur_y);
        for (let y = 1; y <= segments; y++ ) {
            let simplex_val = simplex.noise2D(x_pos, y);
            cur_y = y * y_gap + (simplex_val*8);
            let cur_x = x + (simplex_val*4);
            ctx.lineTo(cur_x, cur_y);
        }
        ctx.stroke();
        ctx.restore();
    }

    for (let x = 0; x < width / padding; x++) {
        //requestAnimationFrame(() => {
            draw_line(x * padding);
        //});
    }


    // put the seed on the bottom
    ctx.save();
    const txt = "#" + seed;
    ctx.font = "20px Helvetica";
    let txt_width = ctx.measureText(txt).width;
    let txt_height = parseInt(ctx.font);
    // draw bg
    ctx.fillStyle = bg;
    ctx.fillRect(5, (height-txt_height-10), txt_width+10, (txt_height+2));

    ctx.fillStyle = line_colour;
    ctx.textBaseline = 'top';
    ctx.fillText(txt, 10, height - (1.5*txt_height));
    ctx.restore();
}

init();
//draw_palette();
const draw = {
    palette: palette_map.draw.bind(palette_map),
    lines: draw_lines,
};

window.draw = draw;
