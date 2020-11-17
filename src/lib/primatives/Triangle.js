import { Point } from './Point.js';

/**
 * A triangle in 2 dimensional space.
 *
 * @property {Point[]} points - the points at the triangle vertices
 * @property {Point} centroid - the centre of the triangle
 *
 */
export class Triangle {
  /**
   * Create a Triangle from points
   * @constructor
   *
   * @param {Point[]} points - An array of 3 {@link Point}s representing the triangle
   *
   */
  constructor(points=[]) {
    this.points = points;
    // order the points CCW
    this.order();
  }

  get centroid() {
    // iterate over the points and then just get the average position
    const avg_x = this.points.reduce(((sum, pt) => sum = sum + pt.x), 0) / this.points.length;
    const avg_y = this.points.reduce(((sum, pt) => sum = sum + pt.y), 0) / this.points.length;

    return new Point(avg_x, avg_y);
  }

  /**
   * Order the points to be CCW. Updates the Triangle.points list.
   */
  order() {
    // look at the points in turn and then sort them by
    // angle from the centre to each point in turn. Lowest first.
    const centre = this.centroid;

    const sorted_points = this.points.sort((pt_a, pt_b) => {
      // calculate angle from centre point to the two compare points and
      // return the one with the lower angle value.
      const pt_a_angle = Math.atan2(pt_a.x - centre.x, pt_a.y - centre.y);
      const pt_b_angle = Math.atan2(pt_b.x - centre.x, pt_b.y - centre.y);

      return pt_b_angle - pt_a_angle;
    });

    // overwrite the original points.
    this.points = sorted_points;
  }

  /**
   * Get the points that make up the longest edge
   * @returns {Integer[]} The vertix indices from the .points array of the longest edge
   */
  longest_edge() {
    // look at each edge in turn and determine which is the longest one.
    const { points } = this;

    let longest = [0, 1];
    let max_distance = points[0].distance(points[1]);

    if (points[1].distance(points[2]) > max_distance) {
      longest = [1, 2];
      max_distance = points[1].distance(points[2]);
    }

    if (points[2].distance(points[0]) > max_distance) {
      longest = [2, 0];
      // don't need the distance as just need the vertices
    }

    return longest;
  }

  /**
   * Take the current triangle and then subdivide this along the longest edge
   *
   * @param {Number} count - when calling recursively, mow much deeper to go
   * @param {Number} stop - percentage chance to stop at this level
   *
   * @returns {Triangle[]} List of triangles recursively subdivided
   */
  subdivide(count=0, stop=0.05) {
    const longest_vertices = this.longest_edge();

    // find the vertex which isn't in the longest edge
    let dividing_vertex;
    for (let i = 0; i < 3; i++) {
      if (! longest_vertices.includes(i)) {
        dividing_vertex = i;
        break;
      }
    }

    // make a new point which is the split of the longest edge vertices.
    const lev_1 = this.points[longest_vertices[0]];
    const lev_2 = this.points[longest_vertices[1]];

    // calculate the midpoint
    const mx = lev_1.x + ((lev_2.x - lev_1.x) / 2);
    const my = lev_1.y + ((lev_2.y - lev_1.y) / 2);
    const midpoint = new Point(mx, my);

    const t1 = new Triangle([this.points[dividing_vertex], lev_1, midpoint]);
    const t2 = new Triangle([this.points[dividing_vertex], lev_2, midpoint]);

    let sub_triangles = [];
    if (count == 0) {
      sub_triangles.push(t1);
      sub_triangles.push(t2);
    } else {
      // Determine whether to stop prematurely by change or call recursively
      // to do another subdivision. Either way, create an array of returning
      // triangles
      // do t1
      if (Math.random() < stop) {
        sub_triangles.push(t1);
      } else {
        sub_triangles = [...t1.subdivide(count-1)];
      }

      if (Math.random() < stop) {
        sub_triangles.push(t2);
      } else {
        sub_triangles = [...sub_triangles, ...t2.subdivide(count-1)];
      }
    }

    return sub_triangles;
  }
}
