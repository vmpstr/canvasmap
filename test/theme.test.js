import { Theme } from '../src/theme.mjs';

"use strict;"

describe("theme", () => {
  it("has fontFace", () => {
    expect(Theme.fontFace()).toBeTruthy();
    expect(Theme.fontFace({ font: { face: "testface" }})).toBe("testface");
  })

  it("has fontSize", () => {
    expect(Theme.fontSize()).toBeGreaterThan(0);
    expect(Theme.fontSize({ font: { size: 123 }})).toBe(123);
  })

  it("has fontColor", () => {
    expect(Theme.fontColor()).toBeDefined();
    expect(Theme.fontColor({ font: { color: 123 }})).toBe(123);
    expect(Theme.fontColor({ font: { color: "red" }})).toBe("red");
    expect(Theme.fontColor({ font: { color: 0 }})).toBe(0);
  })

  it("has fontStyle", () => {
    expect(Theme.fontStyle()).toMatch(/px /);
    expect(Theme.fontStyle({ font: { size: 123, face: "testface" }}))
      .toBe("123px testface");
  })
});
