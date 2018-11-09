'use strict';

export default class Mask {
  // creates an abstract class for a Mask that can be used to define
  // an area of the canvas to draw on and not go outside that boundary.
  // provides the mask that is needed
  constructor(options) {
    // build a new mask
    const opts = options || {};
    this.height = opts.height;
    this.width = opts.width;
  }

  clip(ctx) {
    // abstract interface for the mask drawing actions.
  }
}
