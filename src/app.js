import seedrandom from 'seedrandom';
import arrayShuffle from 'array-shuffle';
const contrast = require('wcag-contrast');
const simplex_noise = require('simplex-noise');

const palettes = require('./lib/palette.json');

let Canvas = null;

let width, height;

//Math.seedrandom('hithere');

function init() {

    if (window) {
        Canvas = document.getElementById("canv");

    } else {
    //    let Canvas = require('canvas');
    }


    window._palettes = palettes;
}

function best_contrast(palette, bg) {
    // takes a palette and returns the index of the best colour for the background
    let best_contrast = 0;
    let c_ratio = 0;
    palette.forEach((colour, i) => {
        // do the contrast check.
        if (contrast.hex(bg, colour) > c_ratio) {
            best_contrast = i;
            c_ratio = contrast.hex(bg, colour);
        }
    });

    return best_contrast;
}

function draw_palette() {
    // draw the palettes out.
    Canvas.height = 0.5 * Canvas.width;
    Canvas.style.height = (Canvas.height) / 2 + "px"; // deal with retina

    const rows = 10;
    const cols = palettes.length / rows;
    const padding = 5;

    width = Canvas.width;
    height = Canvas.height;

    const palette_h = (height + padding) / rows;
    const palette_w = (width + padding) / cols;
    const tile_h = palette_h - padding;
    const tile_w = (palette_w - padding) / palettes[0].length;

    let ctx = Canvas.getContext('2d');
    //canvasDpiScaler(Canvas, ctx);
    window.ctx = ctx;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    palettes.forEach((palette, i) => {
        const col = Math.floor(i % cols);
        const row = Math.floor(i / cols);

        const x = col * palette_w;
        const y = row * palette_h;

        ctx.save();
        ctx.translate(x, y);

        let bg = palette[0];

        palette.forEach((colour, j) => {
            let tile_x = j * tile_w;
            ctx.fillStyle = colour;
            ctx.fillRect(tile_x, 0, tile_w, tile_h);
        });

        // draw the strip horizontally for the contrast strip.
        ctx.fillStyle = palette[best_contrast(palette, palette[0])];
        ctx.fillRect(0, (0.5*tile_h) - (0.5*tile_w), palette_w-padding, tile_w);

        ctx.restore();

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



const draw = {
    palette: draw_palette,
    lines: draw_lines,
};

window.draw = draw;

init();
//draw_palette();
