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
      this.data_.push(new TestItem("Test", data[i]));
    }
  }
}

class TestItem {
  constructor(id_namespace, json) {
    this.json_ = json;
    this.id_namespace_ = id_namespace;
  }

  construct(layout_item) {
    layout_item.label_ = this.json_.label;
    layout_item.ancestors_ = [];
    if (this.json_.blocking) {
      for (let i = 0; i < this.json_.blocking.length; ++i) {
        layout_item.ancestors_.push(this.id_namespace_ + this.json_.blocking[i]);
      }
    }
    layout_item.descendants_ = [];
    if (this.json_.blocked_on) {
      for (let i = 0; i < this.json_.blocked_on.length; ++i) {
        layout_item.descendants_.push(this.id_namespace_ + this.json_.blocked_on[i]);
      }
    }
  }

  get id_namespace() {
    return this.id_namespace_;
  }

  get local_id() {
    return this.json_.bug;
  }
}

