import { Rect } from '../src/geometry/rect.mjs';

describe('Rect', () => {
  it("should have getters", () => {
    const r = new Rect([1, 2], [3, 4]);
    expect(r.x).toBe(1);
    expect(r.y).toBe(2);
    expect(r.width).toBe(3);
    expect(r.height).toBe(4);
    expect(r.left).toBe(1);
    expect(r.right).toBe(4);
    expect(r.top).toBe(2);
    expect(r.bottom).toBe(6);
  })
  it("should contain inner points", () => {
    const r = new Rect([10, 20], [30, 40]);
    expect(r.containsPoint([11, 21])).toBeTruthy();
    expect(r.containsPoint([15, 59])).toBeTruthy();
    expect(r.containsPoint([39, 59])).toBeTruthy();
  })
  it("should not contain edge points", () => {
    const r = new Rect([10, 20], [30, 40]);
    expect(r.containsPoint([10, 20])).toBeFalsy();
    expect(r.containsPoint([10, 30])).toBeFalsy();
    expect(r.containsPoint([10, 60])).toBeFalsy();
    expect(r.containsPoint([20, 20])).toBeFalsy();
    expect(r.containsPoint([20, 60])).toBeFalsy();
    expect(r.containsPoint([40, 20])).toBeFalsy();
    expect(r.containsPoint([40, 30])).toBeFalsy();
    expect(r.containsPoint([40, 60])).toBeFalsy();
  })
  it("should not contain outer points", () => {
    const r = new Rect([10, 20], [30, 40]);
    expect(r.containsPoint([1, 20])).toBeFalsy();
    expect(r.containsPoint([1, 30])).toBeFalsy();
    expect(r.containsPoint([1, 60])).toBeFalsy();
    expect(r.containsPoint([20, 10])).toBeFalsy();
    expect(r.containsPoint([20, 70])).toBeFalsy();
    expect(r.containsPoint([50, 20])).toBeFalsy();
    expect(r.containsPoint([50, 30])).toBeFalsy();
    expect(r.containsPoint([50, 60])).toBeFalsy();
  })
})
