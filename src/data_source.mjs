'use strict';

import { TestDataSource } from './data_sources/test_data_source.mjs';
import { GithubDataSource } from './data_sources/github_data_source.mjs';

export class EmptyDataSource {
  get data() { return []; }
  load() {}
}


export class DataSource {
  static Create(type, settings) {
    if (type === "test")
      return new TestDataSource(settings);
    if (type === "github")
      return new GithubDataSource(settings);
    return new EmptyDataSource(settings);
  }
}

