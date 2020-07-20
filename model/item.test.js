import { Item } from "./item.mjs";

describe("item tests", () => {
  test("id is unique and positive", () => {
    const i1 = new Item();
    const i2 = new Item();
    const i3 = new Item();

    expect(i1.id).toBeGreaterThan(0);
    expect(i2.id).toBeGreaterThan(0);
    expect(i3.id).toBeGreaterThan(0);

    expect(i1.id).not.toBe(i2.id);
    expect(i1.id).not.toBe(i3.id);
    expect(i2.id).not.toBe(i3.id);
  });

  test("name can be changed", () => {
    const item = new Item();
    expect(item.name).toBeDefined();
    expect(item.name).toBe("");

    item.name = "test";
    expect(item.name).toBe("test");

    item.name = "another test";
    expect(item.name).toBe("another test");
  });
});


