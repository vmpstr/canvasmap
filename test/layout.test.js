'use strict';

import { AppCanvas } from '../src/app_canvas.mjs';
import { Layout } from '../src/layout.mjs';
import { Point } from '../src/geometry/point.mjs';

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
  })
})
