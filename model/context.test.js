import { Context } from "./context.mjs";

describe("context tests", () => {
  test("id is positive and unique", () => {
    const c1 = new Context();
    const c2 = new Context();
    expect(c1.id).toBeGreaterThan(0);
    expect(c2.id).toBeGreaterThan(0);
    expect(c1.id).not.toBe(c2.id);
  });

  test("name exists even if blank", () => {
    const c = new Context();
    expect(c.name).toBeDefined();
    expect(c.name).toBe("");
  });

  test("ctor can be changed", () => {
    const c = new Context("test");
    expect(c.name).toBe("test");
    c.name = "another test";
    expect(c.name).toBe("another test");
  });

  test("can add and remove items", () => {
    const c = new Context();

    expect(c.items.length).toBe(0);
    c.addItem("test");
    expect(c.items).toContain("test");
    c.addItem("a");
    c.addItem("b");
    c.addItem("c");
    expect(c.items).toContain("a");
    expect(c.items).toContain("b");
    expect(c.items).toContain("c");
    expect(c.items.length).toBe(4);

    c.removeItem("b");
    expect(c.items).not.toContain("b");
    c.addItem("d");
    expect(c.items).toContain("d");
    expect(c.items.length).toBe(4);
  });

  test("observers see name changes", () => {
    const c = new Context();

    const mock = jest.fn();
    c.addObserver(mock);
    expect(mock.mock.calls.length).toBe(0);
    c.name = "test";
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toBe(c);

    c.name = "test";
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toBe(c);

    c.name = "another test";
    expect(mock.mock.calls.length).toBe(2);
    expect(mock.mock.calls[1][0]).toBe(c);
  });

  test("observers see child changes", () => {
    const c = new Context();

    const mock = jest.fn();
    c.addObserver(mock);
    expect(mock.mock.calls.length).toBe(0);

    c.addItem("test");
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toBe(c);

    c.addItem("another test");
    expect(mock.mock.calls.length).toBe(2);
    expect(mock.mock.calls[1][0]).toBe(c);

    c.removeItem("test");
    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[2][0]).toBe(c);
  });

  test("observers removes itself in observation", () => {
    const c = new Context();

    let count = 0;
    const observer = (context) => {
      context.removeObserver(observer);
      ++count;
    };
    c.addObserver(observer);
    expect(count).toBe(0);
    c.name = "trigger";
    expect(count).toBe(1);
    c.name = "trigger2";
    expect(count).toBe(1);
    c.name = "trigger3";
    expect(count).toBe(1);
  });
});

