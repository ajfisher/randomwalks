import { Fillable } from './fillable.js';

import { PointVector } from '../primatives/Point.js';

import { hsvts } from '../utils/draw.js';

/**
 * Make a fill using hatched lines following a vector
 * @extends Fillable
 */
export class VectorHatchFill extends Fillable {
  /**
   * Create the fillable
   *
   * @param {Object=} options - FillOptions to use for this fill
   *
   */
  constructor(options={}) {
    super(options);

    this.line_width = options.line_width || 0.001;
    this.fill_width = options.fill_width || 0.1;
    this.vector = options.vector || new PointVector();
  }

  /**
   * Fill the space with hatching along the given vector
   *
   * @param {Context2D} ctx - context to draw to
   */
  fill(ctx, ...rest) {
    const { width, height, alpha, colour, density, noise} = this;
    const { vector, line_width, fill_width } = this;

    super.init(ctx);

    if (this.mask) {
      ctx.save();
      this.mask.clip(ctx);
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = hsvts(colour);
    ctx.lineWidth = line_width * width;

    const start_x = vector.x;
    const start_y = vector.y;

    const no_lines = (fill_width / line_width) * density;
    const gap = (fill_width / no_lines) - (line_width);

    for (let l = 0; l < no_lines; l++) {
      const lt = l / no_lines;

      ctx.save();
      ctx.translate(start_x * width, start_y * height);
      ctx.rotate(vector.angle);

      let x1 = 0;
      let y1 = (l - 0.5 * no_lines) * gap;
      let x2 = vector.length;
      let y2 = (l - 0.5 * no_lines) * gap;

      if (noise) {
        const x1_noise = noise.noise2D(lt, x1);
        const y1_noise = noise.noise2D(lt, y1);
        const x2_noise = noise.noise2D(lt, x2);
        const y2_noise = noise.noise2D(lt, y2);

        x1 = x1 + (x1_noise * gap);
        x2 = x2 + (x2_noise * gap);
        y1 = y1 + (y1_noise * 0.6 * gap);
        y2 = y2 + (y2_noise * 0.6 * gap);
      }

      ctx.beginPath();
      ctx.moveTo(x1 * width, y1 * height);
      ctx.lineTo(x2 * width, y2 * height);
      ctx.stroke();

      ctx.restore();
    }

    // restore initial save
    ctx.restore();

    // restore any clip transforms.
    if (this.mask) {
      ctx.restore();
    }
  }
}
