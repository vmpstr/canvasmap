'use strict';

import { AppCanvas } from '../src/app_canvas.mjs';
import { Layout } from '../src/layout.mjs';
import { Point } from '../src/geometry/point.mjs';
import { Rect } from '../src/geometry/rect.mjs';

describe("Layout", () => {
  it("has a constructor", () => {
    const app = new AppCanvas();
    const layout = new Layout(app.ctx);

    expect(layout.last_item).not.toBeDefined();
    expect(layout.items).toStrictEqual([]);
    expect(layout.tree).toStrictEqual({});
    expect(layout.tree_is_dirty).toBeFalsy();
    expect(layout.needs_layout).toBeFalsy();
  })

  it("can add one item", () => {
    const app = new AppCanvas();
    const layout = new Layout(app.ctx);

    const construct = jest.fn();
    layout.addItem(
      {
        local_id: 5,
        id_namespace: "namespace",
        construct: construct
      }, new Point([1, 2]));

    expect(layout.last_item).toBeDefined();
    expect(layout.last_item.id).toBe("namespace5");
    expect(construct).toHaveBeenCalledTimes(1);
    expect(layout.tree_is_dirty).toBeTruthy();

    layout.rebuild();
    expect(layout.tree_is_dirty).toBeFalsy();
    expect(layout.needs_layout).toBeTruthy();
    expect(layout.items.length).toBe(1);
    expect(layout.tree["namespace5"]).toBeDefined();

    layout.layout();
    expect(layout.tree_is_dirty).toBeFalsy();
    expect(layout.needs_layout).toBeFalsy();
    expect(layout.items.length).toBe(1);
    expect(layout.tree["namespace5"]).toBeDefined();

    const item = layout.tree["namespace5"];
    expect(item.position).toStrictEqual(new Point([1, 2]));
    expect(item.size[0]).toBeGreaterThan(0);
    expect(item.size[1]).toBeGreaterThan(0);
  })

  it("can add multiple items", () => {
    const app = new AppCanvas();
    const layout = new Layout(app.ctx);

    const construct = jest.fn();
    layout.addItem(
      {
        local_id: 5,
        id_namespace: "namespace",
        construct: construct
      }, new Point([1, 2]));
    layout.addItem(
      {
        local_id: 6,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 10]));

    expect(layout.last_item).toBeDefined();
    expect(layout.last_item.id).toBe("test6");
    expect(construct).toHaveBeenCalledTimes(2);
    expect(layout.tree_is_dirty).toBeTruthy();

    layout.rebuild();
    expect(layout.tree_is_dirty).toBeFalsy();
    expect(layout.needs_layout).toBeTruthy();
    expect(layout.items.length).toBe(2);
    expect(layout.tree["namespace5"]).toBeDefined();
    expect(layout.tree["test6"]).toBeDefined();

    layout.layout();
    expect(layout.tree_is_dirty).toBeFalsy();
    expect(layout.needs_layout).toBeFalsy();
    expect(layout.items.length).toBe(2);
    expect(layout.tree["namespace5"]).toBeDefined();
    expect(layout.tree["test6"]).toBeDefined();

    const first_item = layout.tree["namespace5"];
    expect(first_item.position).toStrictEqual(new Point([1, 2]));
    expect(first_item.size[0]).toBeGreaterThan(0);
    expect(first_item.size[1]).toBeGreaterThan(0);

    const second_item = layout.tree["test6"];
    expect(second_item.position).toStrictEqual(new Point([5, 10]));
    expect(second_item.size[0]).toBeGreaterThan(0);
    expect(second_item.size[1]).toBeGreaterThan(0);
  })

  it("can getItemAtPoint", () => {
    const app = new AppCanvas();
    const layout = new Layout(app.ctx);

    const construct = jest.fn();
    layout.addItem(
      {
        local_id: 5,
        id_namespace: "namespace",
        construct: construct
      }, new Point([1, 2]));

    expect(layout.getItemAtPoint(new Point([2, 3]))).toBeDefined();
    expect(layout.getItemAtPoint(new Point([0, 1]))).not.toBeDefined();
  })

  it("can getItemsInRect", () => {
    const app = new AppCanvas();
    const layout = new Layout(app.ctx);

    const construct = jest.fn();
    layout.addItem(
      {
        local_id: 5,
        id_namespace: "namespace",
        construct: construct
      }, new Point([1, 2]));
    layout.addItem(
      {
        local_id: 6,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));

    const both = layout.getItemsInRect(new Rect([0, 0], [10, 200]));
    expect(both.length).toBe(2);

    const first = layout.getItemsInRect(new Rect([3, 4], [10, 10]));
    expect(first.length).toBe(1);

    const second = layout.getItemsInRect(new Rect([0, 50], [50, 60]));
    expect(second.length).toBe(1);
    expect(first[0].id).not.toStrictEqual(second[0].id);

    const none = layout.getItemsInRect(new Rect([-1, -1], [1, 1]));
    expect(none.length).toBe(0);
  })

  it("can appendChild",  () => {
    const app = new AppCanvas();
    const layout = new Layout(app.ctx);

    const construct = jest.fn();
    layout.addItem(
      {
        local_id: 5,
        id_namespace: "namespace",
        construct: construct
      }, new Point([1, 2]));
    const first_item = layout.last_item;

    layout.addItem(
      {
        local_id: 6,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const second_item = layout.last_item;

    expect(first_item.id).toBe("namespace5");
    expect(second_item.id).toBe("test6");

    layout.appendChild(first_item, second_item);
    expect(layout.tree_is_dirty).toBeFalsy();

    for (let i = 0; i < 2; ++i) {
      layout.layoutIfNeeded();
      expect(first_item.children.length).toBe(1);
      expect(first_item.children[0]).toStrictEqual(second_item);
      expect(second_item.parent).toStrictEqual(first_item);

      expect(first_item.position).toStrictEqual(new Point([1, 2]));
      expect(second_item.position[0]).toBeGreaterThan(5);
      expect(second_item.position[1]).toBeLessThan(100);

      // Force rebuild at the end, to ensure things stay the same.
      layout.rebuild();
    }
  })

  it("can insertChild",  () => {
    const app = new AppCanvas();
    const layout = new Layout(app.ctx);

    const construct = jest.fn();
    layout.addItem(
      {
        local_id: 5,
        id_namespace: "namespace",
        construct: construct
      }, new Point([1, 2]));
    const first_item = layout.last_item;

    layout.addItem(
      {
        local_id: 6,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const second_item = layout.last_item;

    layout.addItem(
      {
        local_id: 7,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const third_item = layout.last_item;

    layout.addItem(
      {
        local_id: 8,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const fourth_item = layout.last_item;

    expect(first_item.id).toBe("namespace5");
    expect(second_item.id).toBe("test6");
    expect(third_item.id).toBe("test7");
    expect(fourth_item.id).toBe("test8");

    // After this sequence, we should expect children of first to be
    // second, fourth, third in that order.
    layout.insertChild(first_item, undefined, second_item);
    layout.insertChild(first_item, second_item, third_item);
    layout.insertChild(first_item, second_item, fourth_item);
    expect(layout.tree_is_dirty).toBeFalsy();

    for (let i = 0; i < 2; ++i) {
      layout.layoutIfNeeded();
      expect(first_item.children.length).toBe(3);
      expect(first_item.children[0]).toStrictEqual(second_item);
      expect(first_item.children[1]).toStrictEqual(fourth_item);
      expect(first_item.children[2]).toStrictEqual(third_item);

      expect(second_item.parent).toStrictEqual(first_item);
      expect(third_item.parent).toStrictEqual(first_item);
      expect(fourth_item.parent).toStrictEqual(first_item);

      expect(first_item.position).toStrictEqual(new Point([1, 2]));
      expect(second_item.position[0]).toBeGreaterThan(first_item.position[0]);
      expect(second_item.position[1]).toBeLessThan(100);

      expect(fourth_item.position[0]).toBe(second_item.position[0]);
      expect(fourth_item.position[1]).toBeGreaterThan(second_item.position[1]);

      expect(third_item.position[0]).toBe(fourth_item.position[0]);
      expect(third_item.position[1]).toBeGreaterThan(fourth_item.position[1]);

      // Force rebuild at the end, to ensure things stay the same.
      layout.rebuild();
    }
  })

  it("can replaceChild", () => {
    const app = new AppCanvas();
    const layout = new Layout(app.ctx);

    const construct = jest.fn();
    layout.addItem(
      {
        local_id: 5,
        id_namespace: "namespace",
        construct: construct
      }, new Point([1, 2]));
    const first_item = layout.last_item;

    layout.addItem(
      {
        local_id: 6,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const second_item = layout.last_item;

    layout.addItem(
      {
        local_id: 7,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const third_item = layout.last_item;

    expect(first_item.id).toBe("namespace5");
    expect(second_item.id).toBe("test6");
    expect(third_item.id).toBe("test7");

    layout.appendChild(first_item, second_item);
    layout.replaceChild(first_item, second_item, third_item);
    expect(layout.tree_is_dirty).toBeFalsy();

    for (let i = 0; i < 2; ++i) {
      layout.layoutIfNeeded();
      expect(first_item.children.length).toBe(1);
      expect(first_item.children[0]).toStrictEqual(third_item);

      expect(first_item.parent).not.toBeDefined();
      expect(second_item.parent).not.toBeDefined();
      expect(third_item.parent).toStrictEqual(first_item);

      // Force rebuild at the end, to ensure things stay the same.
      layout.rebuild();
    }
  })

  it("can replaceChild already parented", () => {
    const app = new AppCanvas();
    const layout = new Layout(app.ctx);

    const construct = jest.fn();
    layout.addItem(
      {
        local_id: 5,
        id_namespace: "namespace",
        construct: construct
      }, new Point([1, 2]));
    const first_item = layout.last_item;

    layout.addItem(
      {
        local_id: 6,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const second_item = layout.last_item;

    layout.addItem(
      {
        local_id: 7,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const third_item = layout.last_item;

    layout.addItem(
      {
        local_id: 8,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const fourth_item = layout.last_item;

    expect(first_item.id).toBe("namespace5");
    expect(second_item.id).toBe("test6");
    expect(third_item.id).toBe("test7");
    expect(fourth_item.id).toBe("test8");

    layout.appendChild(first_item, second_item);
    layout.appendChild(third_item, fourth_item);
    layout.replaceChild(first_item, second_item, fourth_item);
    expect(layout.tree_is_dirty).toBeFalsy();

    for (let i = 0; i < 2; ++i) {
      layout.layoutIfNeeded();
      expect(first_item.children.length).toBe(1);
      expect(first_item.children[0]).toStrictEqual(fourth_item);

      expect(first_item.parent).not.toBeDefined();
      expect(second_item.parent).not.toBeDefined();
      expect(fourth_item.parent).toStrictEqual(first_item);
      expect(third_item.children.length).toBe(0);

      // Force rebuild at the end, to ensure things stay the same.
      layout.rebuild();
    }
  })

  it("can replaceChild with grandchild", () => {
    const app = new AppCanvas();
    const layout = new Layout(app.ctx);

    const construct = jest.fn();
    layout.addItem(
      {
        local_id: 5,
        id_namespace: "namespace",
        construct: construct
      }, new Point([1, 2]));
    const first_item = layout.last_item;

    layout.addItem(
      {
        local_id: 6,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const second_item = layout.last_item;

    layout.addItem(
      {
        local_id: 7,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const third_item = layout.last_item;

    expect(first_item.id).toBe("namespace5");
    expect(second_item.id).toBe("test6");
    expect(third_item.id).toBe("test7");

    layout.appendChild(first_item, second_item);
    layout.appendChild(second_item, third_item);
    layout.replaceChild(first_item, second_item, third_item);
    expect(layout.tree_is_dirty).toBeFalsy();

    for (let i = 0; i < 2; ++i) {
      layout.layoutIfNeeded();
      expect(first_item.children.length).toBe(1);
      expect(first_item.children[0]).toStrictEqual(third_item);

      expect(first_item.parent).not.toBeDefined();
      expect(second_item.parent).not.toBeDefined();
      expect(third_item.parent).toStrictEqual(first_item);
      expect(second_item.children.length).toBe(0);

      // Force rebuild at the end, to ensure things stay the same.
      layout.rebuild();
    }
  })

  it("can removeChild", () => {
    const app = new AppCanvas();
    const layout = new Layout(app.ctx);

    const construct = jest.fn();
    layout.addItem(
      {
        local_id: 5,
        id_namespace: "namespace",
        construct: construct
      }, new Point([1, 2]));
    const first_item = layout.last_item;

    layout.addItem(
      {
        local_id: 6,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const second_item = layout.last_item;

    layout.addItem(
      {
        local_id: 7,
        id_namespace: "test",
        construct: construct
      }, new Point([5, 100]));
    const third_item = layout.last_item;

    expect(first_item.id).toBe("namespace5");
    expect(second_item.id).toBe("test6");
    expect(third_item.id).toBe("test7");

    layout.appendChild(first_item, second_item);
    layout.appendChild(second_item, third_item);
    layout.removeChild(first_item, second_item);
    expect(layout.tree_is_dirty).toBeFalsy();

    for (let i = 0; i < 2; ++i) {
      layout.layoutIfNeeded();
      expect(first_item.children.length).toBe(0);

      expect(first_item.parent).not.toBeDefined();
      expect(second_item.parent).not.toBeDefined();
      expect(third_item.parent).toStrictEqual(second_item);
      expect(second_item.children.length).toBe(1);
      expect(second_item.children[0]).toStrictEqual(third_item);

      // Force rebuild at the end, to ensure things stay the same.
      layout.rebuild();
    }
  })

  // TODO(vmpstr): Dragging and placeholder tests.
})
