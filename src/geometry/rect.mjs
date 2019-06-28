export class Rect {
  constructor(position, size) {
    console.assert(position);
    console.assert(position.length == 2);
    console.assert(size);
    console.assert(size.length == 2);

    this.position_ = position;
    this.size_ = size;
  }

  get x() {
    return this.position_[0];
  }

  set x(v) {
    this.position_[0] = v;
  }

  get y() {
    return this.position_[1];
  }

  set y(v) {
    this.position_[1] = v;
  }

  get width() {
    return this.size_[0];
  }

  set width(v) {
    this.size_[0] = v;
  }

  get height() {
    return this.size_[1];
  }

  set height(v) {
    this.size_[1] = v;
  }

  get left() {
    return this.position_[0];
  }

  get right() {
    return this.position_[0] + this.size_[0];
  }

  get top() {
    return this.position_[1];
  }

  get bottom() {
    return this.position_[1] + this.size_[1];
  }

  get position() {
    return this.position_;
  }

  set position(v) {
    this.position_ = v;
  }

  get size() {
    return this.size_;
  }

  set size(v) {
    this.size_ = v;
  }
}
