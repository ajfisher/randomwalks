'use strict';

export default class SimplexField {
  // creates a field of forces based on a grid.
  constructor(rows, cols, noise, scale) {
    // creates a new `ForceField` of rows and cosl
    // takes a simplex noise function and will
    // return a -1.0..1.0 float.

    this.rows = rows;
    this.cols = cols;
    this.noise = noise;

    this.scale = scale || 0.05;

    this.forces = [];
    for (let x = 0; x < cols; x++) {
      const col = [];
      for (let y = 0; y < rows; y++) {
        const c = {
          f: this.noise.noise2D(x * this.scale, y * this.scale) * Math.PI
        };

        // work out the components of the force vector
        c.xf = Math.cos(c.f);
        c.yf = Math.sin(c.f);

        col.push(c);
      }
      this.forces.push(col);
    }
  }
}
