'use strict';
// A set of geometry fucntions that are useful

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

