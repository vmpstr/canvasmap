import { DataSource } from '../src/data_source.mjs';

describe("DataSources", () => {
  beforeEach(() => {
    fetch.resetMocks();
  })

  it("creates a github data source", async () => {
    fetch.mockResponseOnce(JSON.stringify([
      { id: 5, title: "test" },
      { id: 10, title: "and another" }
    ]));
    const data_source = DataSource.Create("github", { repo: "test/repo" });
    await data_source.load();

    expect(data_source.data[0].toString()).toEqual("GithubItem(5, 'test')");
    expect(data_source.data[1].toString()).toEqual("GithubItem(10, 'and another')");

    expect(fetch.mock.calls.length).toEqual(1);
    expect(fetch.mock.calls[0][0]).toEqual("https://api.github.com/repos/test/repo/issues");
  })
})
