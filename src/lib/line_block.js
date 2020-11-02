import SimplexNoise from 'simplex-noise';

import Drawable from './drawable.js';

import { Actionable } from './actions/index.js';

import { CircleGridMask } from './masks/index.js';
import { CircleFrame } from './primatives/index.js';

import { choose, rnd_range } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';

const TAU = Math.PI * 2;

/**
 * Draw a row of blocks
 *
 */
class BlockRow extends Actionable {
  /**
   * Create the BlockRow
   *
   * @param {object} options - Options to pass in to the actionable
   *
   */

  constructor(options) {
    const opts = options || {};
    super(opts);

    this.line_width = opts.line_width || 0.01;
    this.cell_size = opts.cell_size || 0.1;
    this.cols = opts.cols || 13;
    this.base_flip_chance = 0.2;
    this.max_run = 13;
  }

  /**
   * Draw the BlockRow as an Actionable
   *
   * @param {object} ctx - Canvas Context to draw on
   * @param {string} colour - colour to draw the blocks
   *
   */

  draw(ctx, colour, ...rest) {
    const { height, width, line_width, cell_size, cols, base_flip_chance, max_run } = this;

    const xt = this.translate.x * this.width;
    const yt = this.translate.y * this.height;

    ctx.save();
    ctx.translate(xt, yt);
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = hsvts(colour);
    ctx.strokeStyle = hsvts(colour);
    ctx.strokeWidth = 0;
    // ctx.lineWidth = line_width * width;
    // ctx.lineWidth = 0.9 * cell_size * width;

    // determine the makeup of the line.
    const cells = [];
    let run_count = 0;
    let flip_chance;
    for (let cell = 0; cell < cols; cell++) {
      // choose the type of line we're going to draw on the block
      let line_type;

      // we want to be biased towards keeping the same type, however that
      // should also become more likely to swtich over time.

      if (cell == 0) {
        line_type = choose(['LOW_LINE', 'BLOCK']);
        run_count = 1;
        flip_chance = base_flip_chance;
      } else {
        const rnd = Math.random(); // get random number
        const last_cell_type = cells[cell - 1];

        // increase the likelihood of flipping the longer the run happens.
        flip_chance = flip_chance + rnd_range(0.01, 0.1);

        if (rnd <= flip_chance || run_count >= max_run) {
          line_type = (last_cell_type == 'BLOCK' ? 'LOW_LINE' : 'BLOCK');
          // reset the run and flip chances back to start
          run_count = 1;
          flip_chance = base_flip_chance;
        } else {
          line_type = last_cell_type;
          run_count = run_count + 1;
        }
      }

      cells.push(line_type);
    }

    // draw each cell along the row
    for (let c = 0; c < cols; c++) {
      // now walk the lines.
      // assume it's a line
      ctx.lineWidth = line_width * width;
      if (cells[c] == 'BLOCK') {
        ctx.lineWidth = 0.63 * cell_size * width;
      }

      // figure out where to draw it
      const x = c * cell_size * width;
      let y = 0.685 * cell_size * width; // works for a block

      if (cells[c] === 'LOW_LINE') {
        y = 0.95 * cell_size * width;
      }

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (cell_size * width) + 1, y);
      ctx.stroke();
    }

    // pop the translation to restore the context
    ctx.restore();
  }
}


/**
 * Creates a set of rows that is a grid, using a state system
 * to determine how they are represented
 */
export default class LineBlocks extends Drawable {
  /**
   * Create the Drawable LineBlocks
   *
   * @param {object} options - options to pass into the drawable
   *
   */
  constructor(options) {
    const opts = options || {};

    opts.name = 'lineblocks';
    opts.border = 0.03;

    super(opts);
  }

  /**
   * Set off the drawing process
   *
   * @param (number) seed - A seed for the PRNG
   * @param (object) options - Full set of options for this drawing
   *
   */

  draw(seed, options) {
    // set off the drawing process.

    this.seed = parseInt(seed, 10) || null;
    const opts = options || {};

    // prep the object with all the base conditions
    super.init(opts);

    // add the specific drawing actions now
    const palette = this.palette;

    const { bg, fgs } = rank_contrast(palette);

    opts.bg = bg; // [47, 6, 100];
    opts.fg = fgs[0];
    opts.fgs = fgs;

    // get the basic dimensions of what we need to draw
    const border = Math.floor(this.w(this.border));
    const width = this.w() - 2 * this.border;
    const height = this.h() - 2 * this.border;

    const rows = 43; // rnd_range(11, 23);
    const cols = rows;
    const cell_size = (1.0 - (2 * this.border)) / cols;
    const line_width = 0.001; // Math.ceil((this.w()-border) / no_lines);
    const x = this.border;

    console.log(border, width, height, rows, cols, cell_size, line_width);

    // iterate over the rows and then set up each for drawing
    for (let r = 0; r < rows; r++) {
      const y = this.border + (r * cell_size);

      this.enqueue(new BlockRow({
        alpha: 1,
        width, height,
        line_width,
        translate: { x, y },
        cell_size,
        cols,
        t: r
      }), opts.fg);
    }

    super.execute(opts)
  }
}
