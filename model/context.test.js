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
});
