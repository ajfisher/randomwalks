import fs from 'fs';
import path from 'path';

import Canvas from 'canvas';
const { createCanvas } = Canvas;

import { jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// patch jest.expect to allow for image snapshot matching
expect.extend({ toMatchImageSnapshot });

import LineBlocks from '../../src/lib/line_block.js';

// set up for being able to make an image
import { convert } from '../../src/lib/utils.js';

const palettes = JSON.parse(fs.readFileSync('./src/lib/palette.json'));
const palettes_hsv = convert(palettes);

const size = {
  w: 3, h: 3, dpi: 300, border_cm: 0.25
};

const seed = '123456';
const show_text = true;

const canvas = createCanvas(size.w * size.dpi, size.h * size.dpi);
const texture = createCanvas(size.w * size.dpi, size.h * size.dpi);
const predraw = createCanvas(size.w * size.dpi, size.h * size.dpi);

describe('1. Check image matches for LineBlocks', () => {
  test('1.1. Image matches', () => {
    const drawing = new LineBlocks({
      palettes: palettes_hsv,
      canvas,
      texture,
      predraw,
      show_text
    });

    return new Promise((resolve) => {
      drawing.on('completed', () => {
        const image_buffer = canvas.toBuffer();

        expect(image_buffer).toMatchImageSnapshot();

        return resolve();
      });

      drawing.draw(seed, {size });
    });
  });
});
