'use strict';
// A set of geometry fucntions that are useful

import { reverse } from 'lodash';

export function chaikin(points) {
  // takes the set of polygon points and then uses the chaikin curve algoritm to
  // put in additional subdivisions to try and relax it into a curve.

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

export function convex(points) {
  // take a list of points and then convert them to a convex hull
  // use similar to Graham's Algorithm but we know that the points are
  // the outer points anyway so don't need to contain any

  // find the left and rightmost items
  const xsorted = _.sortBy(points, ['x']);
  const minpt = xsorted[0];
  const maxpt = xsorted[xsorted.length-1];
  // now iterate across the x positions and then add the points to the top
  // and bottom hulls
  const toppts = [];
  let bottompts = [];

  for (let i = 1; i < xsorted.length; i++) {
    const curr_pt = xsorted[i];
    if (curr_pt.y < minpt.y) {
      // check to see if we have a major dip problem
      if (toppts.length >= 2) {
        const lst_pt = toppts[toppts.length-1];
        const sndlst_pt = toppts[toppts.length-2];
        if (lst_pt.y > curr_pt.y && sndlst_pt.y < lst_pt.y) {
          // we have a big dip so push that point to the bottom points instead
          bottompts.push(toppts.pop());
        }
      }
      toppts.push(curr_pt);
    } else {
      bottompts.push(curr_pt);
    }
  }
  bottompts = reverse(bottompts);

  // reconstruct the array in order
  return [minpt, ...toppts, ...bottompts];
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
