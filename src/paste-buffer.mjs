export async function initialize(version) {} 

export class PasteBuffer {
  constructor() {
    this.buffer_ = {};
  }

  store(key, value) {
    this.buffer_[key] = value;
  }

  has(key) {
    return key in this.buffer_;
  }

  retrieve(key) {
    console.assert(this.has(key));
    return this.buffer_[key];
  }
};
