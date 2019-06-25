export class TestDataSource {
  constructor() {
    this.data_ = null;
  }
  get data() {
    return this.data_;
  }

  async load() {
    this.data_ = await fetch('../../data/test_data.json', { cache: "reload" }).then(resp => resp.json());
  }
}

