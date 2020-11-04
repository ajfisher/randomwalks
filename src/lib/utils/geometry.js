'use strict';
// A set of geometry fucntions that are useful
import _ from 'lodash';

export const TAU = Math.PI * 2;

/**
 * A point
 * @typedef {Object} Point
 * @property {number} x - the x value of the point
 * @property {number} y - the y value of the point
 */

/**
 * Take a set of convex polygon points and then use the chaikin curve
 * algorithm to subdivide the segments and relax the polygon into a curve
 *
 * @param {Point[]} points - an array of {@link Point} objects that is a convex polygon
 * @returns {Point[]} new array of {@link Point} objects
 *
 */
export function chaikin(points) {
  const new_points = [];
  for (let p = 0; p < points.length; p++) {
    // for the special case where p == 0, need to get the last point
    let p1;
    if (p == 0) {
      p1 = points[points.length - 1];
    } else {
      p1 = points[p-1];
    }

    const p2 = points[p];

    const q = {
      x: p1.x + 0.25 * (p2.x - p1.x),
      y: p1.y + 0.25 * (p2.y - p1.y)
    };

    const r = {
      x: p1.x + 0.75 * (p2.x - p1.x),
      y: p1.y + 0.75 * (p2.y - p1.y)
    };

    new_points.push(q);
    new_points.push(r);
  }

  return new_points;
}

/**
 * Converts a list of points and convert them to a convex hull
 *
 * @param {Point[]} points - array of Point objects
 *
 * @returns {Point[]} - array of ccw sorted Point objects in convex hull.
 *
 */

export function convex(points) {
  // take a list of points and then convert them to a convex hull
  // use similar to Graham's Algorithm but we know that the points are
  // the outer points anyway so don't need to contain any

  // find the left and rightmost items
  const xsorted = _.sortBy(points, ['x']);

  /**
   * 2D cross product of the two vectors AO and BO
   *
   * @param {Point} a - first point in sequence
   * @param {Point} b - second point in sequence
   * @param {Point} o - last point in sequence
   *
   * @return {number} - negative is CCW turn, positive is cw turn, 0 is colinear
   */
  const cross = (a, b, o) => {
    return ( (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x) );
  };

  // iterate over sorted points left to right and add points to the lower hull
  const lower = [];

  for (let i = 0; i < xsorted.length; i++) {
    const curr_pt = xsorted[i];
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], curr_pt) <= 0 ) {
      // pop any points off the lower hull that have a ccw turn in them which
      // means they are concave
      lower.pop();
    }
    lower.push(curr_pt);
  }

  // now go over the sorted points right to left and add points to the upper hull
  const upper = [];

  for (let i = xsorted.length -1; i >= 0; i--) {
    const curr_pt = xsorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], curr_pt) <= 0 ) {
      // pop any points off the upper hull that have a ccw turn in them which
      // means they are concave
      upper.pop();
    }
    upper.push(curr_pt);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

export function circle_intersections(c1, c2) {
  // based on the maths here:
  // http://math.stackexchange.com/a/1367732
  // based on implementation from here:
  // https://gist.github.com/jupdike/bfe5eb23d1c395d8a0a1a4ddd94882ac

  // c1 and c2 are objects of the form {x, y, r}
  // where x and y are the centre points and r is the radius
  const centerdx = c1.x - c2.x;
  const centerdy = c1.y - c2.y;
  const R = Math.sqrt(centerdx * centerdx + centerdy * centerdy);
  if (!(Math.abs(c1.r - c2.r) <= R && R <= c1.r + c2.r)) { // no intersection
    return []; // empty list of results
  }

  // intersection(s) should exist

  const R2 = R*R;
  const R4 = R2*R2;
  const a = (c1.r*c1.r - c2.r*c2.r) / (2 * R2);
  const r2r2 = (c1.r*c1.r - c2.r*c2.r);
  const c = Math.sqrt(2 * (c1.r*c1.r + c2.r*c2.r) / R2 - (r2r2 * r2r2) / R4 - 1);

  const fx = (c1.x + c2.x) / 2 + a * (c2.x - c1.x);
  const gx = c * (c2.y - c1.y) / 2;
  const ix1 = fx + gx;
  const ix2 = fx - gx;

  const fy = (c1.y + c2.y) / 2 + a * (c2.y - c1.y);
  const gy = c * (c1.x - c2.x) / 2;
  const iy1 = fy + gy;
  const iy2 = fy - gy;

  // note if gy == 0 and gx == 0 then the circles are tangent and there is only one solution
  // but that one solution will just be duplicated as the code is currently written
  return [{x: ix1, y: iy1}, {x: ix2, y: iy2}];
}
