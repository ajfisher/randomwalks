'use strict';

// This module contains utility functions to help with creating random values

export const choose = (choices) => {
  // take an array of items and chooses one of them

  const rnd = Math.floor(Math.random() * choices.length);
  return choices[rnd];
};

export const rnd_range = (v1, v2) => {
  // takes a range of values and returns a value between them

  if (v1 % 1 === 0) {
    // int values
    // need to calculate an int version slightly differently as we want
    // to get the min and max inclusively.
    return Math.floor((Math.random() * (Math.max(v1, v2) - Math.min(v1, v2) + 1) ) + Math.min(v1, v2));
  }
  return (Math.random() * (Math.max(v1, v2) - Math.min(v1, v2)) ) + Math.min(v1, v2);
};

export const rand_range = rnd_range;

let spare = undefined;
let spare_ready = false;

export const nrand = (mean, stddev) => {
  // takes a mean and standard deviation and returns a normally distributed
  // gaussian approximation prng

  if (spare_ready) {
    spare_ready = false;
    return spare * stddev + mean;
  }

  let u;
  let v;
  let s;

  do {
    u = Math.random() * 2 - 1;
    v = Math.random() * 2 - 1;
    s = u * u + v * v;
  } while (s >= 1 || s == 0);

  const mul = Math.sqrt(-2.0 * Math.log(s) / s);
  spare = v * mul;
  spare_ready = true;
  return mean + stddev * u * mul;
};

export const weight_rnd = (choices, weights) => {
  // takes a set of choices and their corresponding weights and then
  // uses this to randomly pick an item from the choice array
  const total_weights = weights.reduce((sum, val) => {
    return sum + val;
  }, 0);

  let rnd = Math.floor(Math.random() * (total_weights + 1));

  for (let i = 0; i < choices.length; i++) {
    rnd = rnd - weights[i];

    if (rnd <= 0) {
      return choices[i];
    }
  }
};

