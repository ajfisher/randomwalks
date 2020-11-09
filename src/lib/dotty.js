import Drawable from './drawable.js';
import Mask from './masks/mask.js';

import { Actionable } from './actions/index.js';
import { Polygon } from './actions/index.js';

import { Circle } from './primatives/index.js';

import { choose, rnd_range, nrand } from './utils/random.js';
import { hsvts, rank_contrast } from './utils/draw.js';
import { chaikin, convex, TAU } from './utils/geometry.js';

/**
 * Creates {@link Mask} with many circular holes on the canvas for drawing
 * @class
 * @extends Mask
 *
 */

class DottyMask extends Mask {
  /**
   * Create the Dotty mask.
   * @param {MaskOptions} options - standard {@link MaskOptions} options
   * @param {Number} options.points - the points for the polygon.
   */

  constructor(options={}) {
    const opts = options;
    super (opts);

    this.no_dots = options.no_dots || 10;
    this.min_gap = options.min_gap || 0.01;

    this.circles = []; // array of points and radiuses

    // create random circles but check if they overlap with existing ones
    let timeout = 0;
    while (this.circles.length < this.no_dots && ++timeout < this.no_dots * 1000) {
      const circle = new Circle({
        x: nrand(0.5, 0.1),
        y: nrand(0.5, 0.1),
        r: rnd_range(0.01, 0.3)
      });

      // check if it intersects a boundary.
      if (circle.x - circle.r < 0.05 || circle.x + circle.r > 0.95 ||
        circle.y - circle.r < 0.05 || circle.y + circle.r > 0.95) {
        // if it does, no point proceeding, so abandon and go around the
        // loop again.
        continue;
      }

      // now check if it intersects the other circles.
      let no_intersect = true;
      for (let c = 0; c < this.circles.length; c++) {
        const xdist = circle.x - this.circles[c].x;
        const ydist = circle.y - this.circles[c].y;
        const rad_sum = circle.r + this.circles[c].r;
        // check intersect
        const C1C2 = Math.sqrt( (xdist * xdist) + (ydist * ydist) );

        // if intersecting then break out of loop as no point testing any more
        if (C1C2 <= (rad_sum + this.min_gap)) {
          no_intersect = false;
          break;
        }
      }

      // if we didn't intersect at all then push it onto the list. Otherwise
      // we go find another.
      if (no_intersect) {
        this.circles.push(circle);
      }
    }
  }

  /**
   * Draw the clipping mask to the context
   *
   * @param {Context2D} ctx - 2D canvas context to apply the mask to
   *
   */

  clip(ctx) {
    const { width, height, rotate, translate, circles } = this;
    super.clip(ctx);

    const xt = translate.x * width;
    const yt = translate.y * height;

    // we start the path, save the context then do the translation and
    // rotation before drawing the clipping region. This allows us to do a
    // restoration within the draw action and then finally effect the clip
    // in the stack, which gets passed back. At the end of this we'll have
    // an appropriately rotated clip plane but the canvas will obey standard
    // orientation rules.

    ctx.beginPath()
    ctx.save();
    ctx.translate(xt, yt);

    // TODO
    // Iterate over the circles, and draw them in then clip the canvas
    // draw the polygon
    for (let c = 0; c < circles.length; c++) {
      const circle = circles[c];
      ctx.moveTo(circle.x * width, circle.y * height);
      ctx.arc(circle.x * width, circle.y * height, circle.r * width, 0, TAU);
    }

    if (this.invert) {
      // if inverted then we draw a "negative" plane across the whole canvas
      // this uses the winding rules to create a reverse mask between the two shapes
      // ctx.rect(width-xt, height-yt, -1 * width, height);
      ctx.rect(width-xt, -1*yt, -width, height);
    }

    ctx.restore();
    ctx.clip();
  }
}

/**
 * Draw circles behind the mask with a background colour as well.
 *
 */
class DottyBackground extends Actionable {
  /**
   * Create the Dotty Background
   *
   * @param {Object=} options - The options for the actionable
   *
   */
  constructor(options={}) {
    super(options);

    this.bg_colour = options.bg_colour || [0, 0, 0];
    this.no_circles = options.no_circles || 3;
    this.min_gap = options.min_gap || 0.01;
    this.mask = options.mask || null;

    this.circles = [];

    // create random circles but check if they overlap with existing ones
    let timeout = 0;
    while (this.circles.length < this.no_circles && timeout < this.no_circles * 3) {
      const circle = new Circle({
        x: rnd_range(0.1, 0.9),
        y: rnd_range(0.1, 0.9),
        r: rnd_range(0.2, 0.4)
      });

      // now check if it intersects the other circles.
      let no_intersect = true;
      for (let c = 0; c < this.circles.length; c++) {
        const xdist = circle.x - this.circles[c].x;
        const ydist = circle.y - this.circles[c].y;
        const rad_sum = circle.r + this.circles[c].r;
        // check intersect
        const C1C2 = Math.sqrt( (xdist * xdist) + (ydist * ydist) );

        // if intersecting then break out of loop as no point testing any more
        if (C1C2 <= (rad_sum + this.min_gap)) {
          no_intersect = false;
          break;
        }
      }

      // if we didn't intersect at all then push it onto the list. Otherwise
      // we go find another.
      if (no_intersect) {
        this.circles.push(circle);
      }

      // put a catch in here if we can't find circles that will fit.
      timeout = timeout + 1;
    }
  }
  /**
   * Draw the background to the context
   *
   * @param {Object} ctx - screen context to draw to
   * @param {Object} colour - HSV colour object to draw with
   */

  draw(ctx, colour, ...rest) {
    const { width, height, circles, bg_colour } = this;

    super.draw(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = this.alpha * 0.9;
    ctx.fillStyle = hsvts(bg_colour);

    // draw the background first
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.rect(0, 0, width, height);
    ctx.fill();

    // now draw the circles over the top
    ctx.fillStyle = hsvts(colour);
    ctx.globalAlpha = this.alpha;

    for (let c = 0; c < circles.length; c++) {
      const circle = circles[c];
      ctx.beginPath();
      ctx.moveTo(circle.x * width, circle.y * height);
      ctx.arc(circle.x * width, circle.y * height, circle.r * width, 0, TAU);
      ctx.fill();
    }

    // restore original transform
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }
  }
}

/**
 * Create a dotty mask drawable
 *
 */

export default class Dotty extends Drawable {
  /**
   * Constructs the Dotty Drawable
   * @param {Object=} options - the options for this drawable
   *
   */
  constructor(options={}) {
    const opts = options;
    opts.name = 'dotty';
    opts.border = 0.0;
    super(opts);
  }

  /**
   * draws the ChaikinBurst to the screen
   *
   * @param {number} seed - random seed to be used for this design
   * @param {Object} options - the options for drawing
   *
   */
  draw(seed, options) {
    // get or create the seed
    this.seed = parseInt(seed, 10) || null;
    const opts = options || {};

    // prep the object with all the base conditions
    super.init(opts);

    // add the specific drawing actions now
    const { palette } = this;

    const { bg, fgs } = rank_contrast(palette);

    opts.bg = bg; // [47, 6, 100];
    opts.fg = fgs[0];
    opts.fgs = fgs;

    // get the basic dimensions of what we need to draw
    const width = this.w(); // - 2 * border;
    const height = this.h(); // - 2 * border;

    const mask = new DottyMask({
      width, height,
      no_dots: rnd_range(40, 100),
      min_gap: rnd_range(0.005, 0.02)
    });

    this.enqueue(new DottyBackground({
      alpha: 1.0,
      width, height,
      no_circles: rnd_range(3, 9),
      min_gap: rnd_range(0.01, 0.03),
      bg_colour: opts.fgs[2],
      mask
    }), opts.fg);

    super.execute(opts);
  }
}
