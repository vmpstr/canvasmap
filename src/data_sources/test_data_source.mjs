export class TestDataSource {
  constructor() {
    this.data_ = null;
  }
  get data() {
    return this.data_;
  }

  async load() {
    const data = await fetch('../../data/test_data.json', { cache: "reload" }).then(resp => resp.json());
    this.data_ = [];
    for (let i = 0; i < data.length; ++i) {
      this.data_.push(new TestItem(data[i]));
    }
  }
}

TestDataSource.id_namespace = "Test";

class TestItem {
  constructor(json) {
    this.json_ = json;
  }

  construct(layout_item) {
    layout_item.label = this.json_.label;
    layout_item.ancestors = [];
    if (this.json_.blocking) {
      for (let i = 0; i < this.json_.blocking.length; ++i) {
        layout_item.ancestors.push(TestDataSource.id_namespace + this.json_.blocking[i]);
      }
    }
    layout_item.descendants = [];
    if (this.json_.blocked_on) {
      for (let i = 0; i < this.json_.blocked_on.length; ++i) {
        layout_item.descendants.push(TestDataSource.id_namespace + this.json_.blocked_on[i]);
      }
    }
  }

  get id_namespace() {
    return TestDataSource.id_namespace;
  }

  get local_id() {
    return this.json_.bug;
  }
}

