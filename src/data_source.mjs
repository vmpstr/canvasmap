import { TestDataSource } from './data_sources/test_data_source.mjs';

export class EmptyDataSource {
  get data() { return []; }
  load() {}
}


export class DataSource {
  static Create(type) {
    if (type === "test")
      return new TestDataSource();
    return new EmptyDataSource();
  }
}

