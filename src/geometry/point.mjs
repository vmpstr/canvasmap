'use strict';

export class Point {
  constructor(position) {
    this[0] = position[0];
    this[1] = position[1];
  }

  get x() {
    return this[0];
  }

  set x(v) {
    this[0] = v;
  }

  get y() {
    return this[1];
  }

  set y(v) {
    this[1] = v;
  }
}
    
