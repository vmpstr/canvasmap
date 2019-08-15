import { LayoutItem } from '../src/layout_item.mjs';
import { Point } from '../src/geometry/point.mjs';
import { AppCanvas } from '../src/app_canvas.mjs';
import { Theme } from '../src/theme.mjs';
import { Rect } from '../src/geometry/rect.mjs';

describe("LayoutItem", () => {
  it("has a constructor", () => {
    const construct = jest.fn((item) => expect(item).toBeDefined());
    const item = new LayoutItem(
      {
        local_id: 7,
        id_namespace: "hello",
        data: 123,
        construct: construct
      }, new Point([11, 22]));

    expect(construct).toHaveBeenCalledTimes(1);
    expect(item.id).toEqual("hello7");
    expect(item.data_item.data).toBe(123);
    expect(item.has_parent).toBeFalsy();
    expect(item.needs_layout).toBeTruthy();
    expect(item.label).toStrictEqual("");
    expect(item.decorators).toBeDefined();
    expect(item.parent).not.toBeDefined();
    expect(item.children).toStrictEqual([]);
    expect(item.selection).toEqual("none");
    expect(item.layout_style).toEqual("default");
  })

  it("can layout", () => {
    const app = new AppCanvas();
    const item = new LayoutItem(
      {
        local_id: 8,
        id_namespace: "namespace",
        construct: jest.fn()
      }, new Point([11, 22]));

    item.layout(app.ctx);
    expect(item.needs_layout).toBeFalsy();
    expect(item.id).toEqual("namespace8");
    expect(item.has_parent).toBeFalsy();
    expect(item.decorators).toBeTruthy();
    expect(item.label_offset).toStrictEqual(
      [Theme.padding(item), Theme.padding(item) + 0.5 * Theme.fontSize(item)]);
    expect(item.label_width).toBe(0);
    expect(item.size).toStrictEqual(
      [Theme.minWidth(item), 2 * Theme.padding(item) + Theme.fontSize(item)]);
    expect(item.bounding_box).toStrictEqual(new Rect(new Point([11, 22]), item.size));
    expect(item.label).toStrictEqual("");
    expect(item.parent).toBeFalsy();
    expect(item.children).toStrictEqual([]);
    expect(item.selection).toBe("none");
    expect(item.position).toStrictEqual(new Point([11, 22]));
  })

  it("needs layout on label change", () => {
    const app = new AppCanvas();
    const item = new LayoutItem(
      {
        local_id: 8,
        id_namespace: "namespace",
        construct: jest.fn()
      }, new Point([11, 22]));

    item.layout(app.ctx);
    expect(item.needs_layout).toBeFalsy();

    item.label = "This is a label";
    expect(item.needs_layout).toBeTruthy();
    item.layout(app.ctx);
    expect(item.needs_layout).toBeFalsy();

    expect(item.id).toEqual("namespace8");
    expect(item.has_parent).toBeFalsy();
    expect(item.decorators).toBeTruthy();
    expect(item.label_offset).toStrictEqual(
      [Theme.padding(item), Theme.padding(item) + 0.5 * Theme.fontSize(item)]);
    expect(item.label_width).toBeGreaterThan(0);
    expect(item.size).toStrictEqual(
      [item.label_width + 2 * Theme.padding(item),
       2 * Theme.padding(item) + Theme.fontSize(item)]);
    expect(item.bounding_box).toStrictEqual(new Rect(new Point([11, 22]), item.size));
    expect(item.label).toStrictEqual("This is a label");
    expect(item.parent).toBeFalsy();
    expect(item.children).toStrictEqual([]);
    expect(item.selection).toBe("none");
    expect(item.position).toStrictEqual(new Point([11, 22]));
  })

  it("needs layout on position change", () => {
    const app = new AppCanvas();
    const item = new LayoutItem(
      {
        local_id: 8,
        id_namespace: "namespace",
        construct: jest.fn()
      }, new Point([11, 22]));

    item.layout(app.ctx);
    expect(item.needs_layout).toBeFalsy();

    item.position = new Point([1, 2]);
    expect(item.needs_layout).toBeTruthy();
    item.layout(app.ctx);
    expect(item.needs_layout).toBeFalsy();

    expect(item.id).toEqual("namespace8");
    expect(item.has_parent).toBeFalsy();
    expect(item.decorators).toBeTruthy();
    expect(item.label_offset).toStrictEqual(
      [Theme.padding(item), Theme.padding(item) + 0.5 * Theme.fontSize(item)]);
    expect(item.label_width).toBe(0);
    expect(item.size).toStrictEqual(
      [Theme.minWidth(item), 2 * Theme.padding(item) + Theme.fontSize(item)]);
    expect(item.bounding_box).toStrictEqual(new Rect(new Point([1, 2]), item.size));
    expect(item.label).toStrictEqual("");
    expect(item.parent).toBeFalsy();
    expect(item.children).toStrictEqual([]);
    expect(item.selection).toBe("none");
    expect(item.position).toStrictEqual(new Point([1, 2]));
  })

  it("needs layout on layout_style change", () => {
    const app = new AppCanvas();
    const item = new LayoutItem(
      {
        local_id: 8,
        id_namespace: "namespace",
        construct: jest.fn()
      }, new Point([11, 22]));

    item.layout(app.ctx);
    expect(item.needs_layout).toBeFalsy();

    item.layout_style = "test";
    expect(item.needs_layout).toBeTruthy();
    item.layout(app.ctx);
    expect(item.needs_layout).toBeFalsy();

    expect(item.id).toEqual("namespace8");
    expect(item.has_parent).toBeFalsy();
    expect(item.decorators).toBeTruthy();
    expect(item.label_offset).toStrictEqual(
      [Theme.padding(item), Theme.padding(item) + 0.5 * Theme.fontSize(item)]);
    expect(item.label_width).toBe(0);
    expect(item.size).toStrictEqual(
      [Theme.minWidth(item), 2 * Theme.padding(item) + Theme.fontSize(item)]);
    expect(item.bounding_box).toStrictEqual(new Rect(new Point([11, 22]), item.size));
    expect(item.label).toStrictEqual("");
    expect(item.parent).toBeFalsy();
    expect(item.children).toStrictEqual([]);
    expect(item.selection).toBe("none");
    expect(item.layout_style).toBe("test");
  })

  it("can layout with pending label", () => {
    const app = new AppCanvas();
    const item = new LayoutItem(
      {
        local_id: 8,
        id_namespace: "namespace",
        construct: jest.fn()
      }, new Point([11, 22]));

    item.layout(app.ctx, "This is a label");
    expect(item.needs_layout).toBeFalsy();
    expect(item.id).toEqual("namespace8");
    expect(item.has_parent).toBeFalsy();
    expect(item.decorators).toBeTruthy();
    expect(item.label_offset).toStrictEqual(
      [Theme.padding(item), Theme.padding(item) + 0.5 * Theme.fontSize(item)]);
    expect(item.label_width).toBeGreaterThan(0);
    expect(item.size).toStrictEqual(
      [item.label_width + 2 * Theme.padding(item),
       2 * Theme.padding(item) + Theme.fontSize(item)]);
    expect(item.bounding_box).toStrictEqual(new Rect(new Point([11, 22]), item.size));
    expect(item.label).toStrictEqual("");
    expect(item.parent).toBeFalsy();
    expect(item.children).toStrictEqual([]);
    expect(item.selection).toBe("none");
    expect(item.position).toStrictEqual(new Point([11, 22]));
  })

  it("can layout as a placeholder", () => {
    const app = new AppCanvas();
    const held_item = new LayoutItem(
      {
        construct: jest.fn()
      }, new Point([1, 2]));

    const item = new LayoutItem(
      {
        local_id: "placeholder",
        construct: jest.fn(),
        held_item: held_item
      }, new Point([11, 22]));

    item.held_item = held_item;
    item.layout(app.ctx);
    expect(item.needs_layout).toBeFalsy();
    expect(held_item.needs_layout).toBeFalsy();
    expect(item.size).toStrictEqual(held_item.size);
    expect(item.position).toStrictEqual(new Point([11, 22]));
  })

  it("can have clickable decorators", () => {
    // TODO(vmpstr): Add clickable decorators
  })
})
