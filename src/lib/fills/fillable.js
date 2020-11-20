import { TAU } from '../utils/geometry.js';

/**
 * Fillable is an abstract class that defines a type of fill on an object
 * @abstract
 *
 */
export class Fillable {
  /**
   * Create the fill
   * @param {Object} options - FillOptions for this fill
   *
   */
  constructor(options) {
    // create a fillable
    const opts = options || {};

    this.height = opts.height || 100;
    this.width = opts.width || 100;

    // order of transformation operations - default translate -> rotate
    this.op_order = (opts.op_order || 'TR').toUpperCase();
    this.rotate = opts.rotate || 0.0;
    this.translate = opts.translate || {x: 0, y: 0};
    this.alpha = opts.alpha || 0.5;

    // clipping path possibly supplied.
    this.mask = opts.mask || false;

    // is the fill a regular fill or an irregular one.
    this.regular = opts.regular || false;

    // how much fill are are we providing
    this.density = opts.density || 0.5;

    this.colour = opts.colour || [0, 0, 0];

    this.noise = opts.noise || null;
  }

  /**
   * Setup for the fill action. Should be called by the implementing class
   * before implementing their own fill method.
   *
   * @param {Context2D} ctx - Context to paint to
   */
  init(ctx, ...rest) {
    const {op_order, translate, rotate, width, height, alpha } = this;
    for (let i = 0; i < op_order.length; i++) {
      const op = op_order[i];

      if (op === 'T') {
        ctx.translate(translate.x * width, translate.y * height);
      } else if (op === 'R') {
        ctx.rotate(rotate * TAU);
      }
    }

    ctx.globalAlpha = alpha;
  }

  /**
   * Defines a method for filling. This base version simply fills the screen
   * @abstract
   *
   * @param {Context2D} ctx - context to pain to
   */
  fill(ctx, ...rest) {
    const { width, height, alpha, colour } = this;

    this.init(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = hsvts(colour);

    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fill();

    // restore initial save
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }
  }
}

