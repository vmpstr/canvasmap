import { Point } from '../src/geometry/point.mjs';

describe('Point', () => {
  it("should have getters", () => {
    const p = new Point([12, 23]);
    expect(p.x).toBe(12);
    expect(p.y).toBe(23);
    expect(p[0]).toBe(12);
    expect(p[1]).toBe(23);
  })

  it("should have setters", () => {
    const p = new Point([12, 23]);
    p.x = 22;
    expect(p.x).toBe(22);
    expect(p[0]).toBe(22);
    expect(p.y).toBe(23);
    expect(p[1]).toBe(23);

    p.y = 33;
    expect(p.x).toBe(22);
    expect(p[0]).toBe(22);
    expect(p.y).toBe(33);
    expect(p[1]).toBe(33);
  })
})
