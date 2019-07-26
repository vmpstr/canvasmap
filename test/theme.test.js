import { Theme } from '../src/theme.mjs';

"use strict;"

describe("theme", () => {
  it("has fontFace", () => {
    expect(Theme.fontFace()).toBeTruthy();
    expect(Theme.fontFace({ has_parent: true })).toBeTruthy();
    expect(Theme.fontFace({ font: { face: "testface" }})).toBe("testface");
  })

  it("has fontSize", () => {
    expect(Theme.fontSize()).toBeGreaterThan(0);
    expect(Theme.fontSize({ has_parent: true })).toBeGreaterThan(0);
    expect(Theme.fontSize({ font: { size: 123 }})).toBe(123);
  })

  it("has fontColor", () => {
    expect(Theme.fontColor()).toBeDefined();
    expect(Theme.fontColor({ has_parent: true })).toBeDefined();
    expect(Theme.fontColor({ font: { color: 123 }})).toBe(123);
    expect(Theme.fontColor({ font: { color: "red" }})).toBe("red");
    expect(Theme.fontColor({ font: { color: 0 }})).toBe(0);
  })

  it("has fontStyle", () => {
    expect(Theme.fontStyle()).toMatch(/px /);
    expect(Theme.fontStyle({ has_parent: true })).toMatch(/px /);
    expect(Theme.fontStyle({ font: { size: 123, face: "testface" }}))
      .toBe("123px testface");
  })

  it("has borderColor", () => {
    expect(Theme.borderColor()).toBeDefined();
    expect(Theme.borderColor({ has_parent: true })).toBeDefined();
    expect(Theme.borderColor({ border: { color: 123 }})).toBe(123);
    expect(Theme.borderColor({ border: { color: "red" }})).toBe("red");
    expect(Theme.borderColor({ border: { color: 0 }})).toBe(0);
  })

  it("has borderWidth", () => {
    expect(Theme.borderWidth()).toBeGreaterThan(0);
    expect(Theme.borderWidth({ has_parent: true })).toBeGreaterThan(0);
    expect(Theme.borderWidth({ border: { width: 123 }})).toBe(123);
    expect(Theme.borderWidth({ border: { width: 0 }})).toBe(0);
  })

  it("has borderRadius", () => {
    expect(Theme.borderRadius()).toBeGreaterThan(0);
    expect(Theme.borderRadius({ has_parent: true })).toBeGreaterThan(0);
    expect(Theme.borderRadius({ border: { radius: 123 }})).toBe(123);
    expect(Theme.borderRadius({ border: { radius: 0 }})).toBe(0);
  })

  it("has padding", () => {
    expect(Theme.padding()).toBeGreaterThan(0);
    expect(Theme.padding({ has_parent: true })).toBeGreaterThan(0);
    expect(Theme.padding({ padding: 123 })).toBe(123);
    expect(Theme.padding({ padding: 0 })).toBe(0);
  })

  it("has fillStyle", () => {
    // TODO(vmpstr): Rename to something other than box.color?
    expect(Theme.fillStyle()).toBeDefined();
    expect(Theme.fillStyle({ has_parent: true })).toBeDefined();
    expect(Theme.fillStyle({ box: { color: "red" }})).toBe("red");
    expect(Theme.fillStyle({ box: { color: 0 }})).toBe(0);
  })

  it("has alphaForDrag", () => {
    expect(Theme.alphaForDrag).toBeGreaterThan(0);
    expect(Theme.alphaForDrag).toBeLessThan(1);
  })

  it("has (default) boxRasterizer", () => {
    expect(Theme.boxRasterizer()).toBeDefined();
    expect(Theme.boxRasterizer({ has_parent: true })).toBeDefined();
    expect(typeof Theme.boxRasterizer()).toBe("function");
    expect(typeof Theme.boxRasterizer({ has_parent: true })).toBe("function");
  })

  it("has (default) edgeRasterizer", () => {
    expect(Theme.edgeRasterizer({ has_parent: true })).toBeDefined();
    expect(typeof Theme.edgeRasterizer({ has_parent: true })).toBe("function");
  })

  it("has edgeContinuation", () => {
    expect(Theme.edgeContinuation({ has_parent: true }, [1, 2], [3, 4])).toBeDefined();
    expect(Theme.edgeContinuation({ has_parent: true }, [1, 2], [3, 4]).length).toBe(2);
  })

  it("has childSpacing", () => {
    expect(Theme.childSpacing()).toBeGreaterThan(0);
    expect(Theme.childSpacing({ has_parent: true })).toBeGreaterThan(0);
    expect(Theme.childSpacing({ child_spacing: 123 })).toBe(123);
    expect(Theme.childSpacing({ child_spacing: 0 })).toBe(0);
  })

  it("has childIndent", () => {
    expect(Theme.childIndent()).toBeGreaterThan(0);
    expect(Theme.childIndent({ has_parent: true })).toBeGreaterThan(0);
    expect(Theme.childIndent({ child_indent: 123 })).toBe(123);
    expect(Theme.childIndent({ child_indent: 0 })).toBe(0);
  })

  it("has edgeRadius", () => {
    expect(Theme.edgeRadius({ has_parent: true })).toBeGreaterThan(0);
    expect(Theme.edgeRadius({ has_parent: true, edge: { radius: 123 }})).toBe(123);
    expect(Theme.edgeRadius({ has_parent: true, edge: { radius: 0 }})).toBe(0);
  })

  it("has edgeColor", () => {
    expect(Theme.edgeColor({ has_parent: true })).toBeDefined();
    expect(Theme.edgeColor({ has_parent: true, edge: { color: "red" }})).toBe("red");
    expect(Theme.edgeColor({ has_parent: true, edge: { color: 0 }})).toBe(0);
  })

  it("has edgeWidth", () => {
    expect(Theme.edgeWidth({ has_parent: true })).toBeGreaterThan(0);
    expect(Theme.edgeWidth({ has_parent: true, edge: { width: 123 }})).toBe(123);
    expect(Theme.edgeWidth({ has_parent: true, edge: { width: 0 }})).toBe(0);
  })

  it("has minWidth", () => {
    expect(Theme.minWidth()).toBeGreaterThanOrEqual(2 * Theme.borderRadius());
  })

  it("has minHeight", () => {
    expect(Theme.minHeight()).toBeGreaterThanOrEqual(2 * Theme.borderRadius());
  })
});
