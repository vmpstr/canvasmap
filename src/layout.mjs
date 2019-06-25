import { LayoutItem } from './layout_item.mjs';
import { Theme } from './theme.mjs';

export class Layout {
  constructor(ctx) {
    this.items_ = [];
    this.items_by_id_ = [];
    this.tree_ = {};
    this.last_item_ = null;
    this.tree_is_dirty_ = true;
    this.ctx_ = ctx;
  }

  addItem(item, position) {
    // TODO(vmpstr): Since the ID may be prefixed, need to figure out the blocking stuff.
    // Probably LayoutItem needs to convert blocked/blocking ids to correct prefix based
    // on item type.
    this.items_.push(new LayoutItem(item, position));
    this.last_item_ = this.items_[this.items_.length - 1];
    this.last_item_.layout(this.ctx_);
    this.items_by_id_[this.last_item_.id] = this.last_item_;
    this.tree_is_dirty_ = true;
    return this.last_item_;
  }

  rebuild() {
    this.tree_ = {};
    for (let i = 0; i < this.items_.length; ++i) {
      const item = this.items_[i];
      // TODO(vmpstr): What if ancestors aren't in the filtered view?
      if (!item.ancestors || item.ancestors.length == 0) {
        item.ancestors = [];
        item.parent = null;
        item.children = [];
        this.rebuildChildren(item);
        this.tree_[item.id] = item;
      }
    }
    this.tree_is_dirty_ = false;
    this.needs_layout_ = true;
  }

  rebuildChildren(item) {
    for (let i = 0; i < item.descendants.length; ++i) {
      const child_id = item.descendants[i];
      console.assert(child_id in this.items_by_id_);
      const child = this.items_by_id_[child_id];
      child.parent = item;
      child.children = [];
      this.rebuildChildren(child);
      item.children.push(child);
    }
  }

  layout() {
    if (this.tree_is_dirty_)
      this.rebuild();

    for (const [key, value] of Object.entries(this.tree_))
      this.layoutRecursive(value);
    this.needs_layout_ = false;
  }

  // Lays out and optionally positions the item, and returns the y offset
  // of the bottom of the last child in this item (ie the spot where the next
  // item can go)
  layoutRecursive(item, start_point) {
    item.layout(this.ctx_);

    // If we're given a start_point, it means our position is restricted
    // by the parent.
    if (start_point !== undefined) {
      console.assert(item.parent);
      item.position = start_point;
    }

    let child_x = item.position[0] + Theme.childIndent(item);
    let child_y = item.position[1] + item.size[1] + Theme.childSpacing(item);

    for (let i = 0; i < item.children.length; ++i) {
      child_y = this.layoutRecursive(item.children[i], [child_x, child_y]);
      child_y += Theme.childSpacing(item);
    }
    return child_y - Theme.childSpacing(item);
  }

  layoutIfNeeded() {
    if (this.tree_is_dirty_)
      this.rebuild();

    if (this.needs_layout_)
      this.layout();
  }

  getItemAtPoint(p) {
    this.layoutIfNeeded();

    for (let i = 0; i < this.items_.length; ++i) {
      const item = this.items_[i];
      if (p[0] > item.position[0] &&
          p[1] > item.position[1] &&
          p[0] < (item.position[0] + item.size[0]) &&
          p[1] < (item.position[1] + item.size[1])) {
        return item;
      }
    }
    return null;
  }

  getItemsInRect(rect) {
    this.layoutIfNeeded();

    let result = [];

    // TODO(vmpstr): Make a rect class.
    const l = rect[0];
    const t = rect[1];
    const r = l + rect[2];
    const b = t + rect[3];

    const item_intersects = (item) => {
      if (!item)
        return false;
      const il = item.position[0];
      const it = item.position[1];
      const ir = il + item.size[0];
      const ib = it + item.size[1];
      return il < r && it < b && ir > l && ib > t;
    }

    for (let i = 0; i < this.items_.length; ++i) {
      if (item_intersects(this.items_[i]))
        result.push(this.items_[i]);
    }
    if (item_intersects(this.placeholder_))
      result.push(this.placeholder_);
    return result;
  }

  get last_item() {
    return this.last_item_;
  }

  get items() {
    return this.items_;
  }

  get tree() {
    return this.tree_;
  }

  startDragging(item) {
    // Start dragging essentially makes the item root and then relies on
    // placeholder code to actually position it.
    // TODO(vmpstr): Need to figure out this and maybe refactor / rework.
    if (item.parent) {
      // TODO(vmpstr): There is a problem if item has multiple ancestors,
      // thus multiple possible parents.
      item.ancestors = [];
      this.removeChildById(item.parent, item.id);
      this.tree_is_dirty_ = true;
    }

    if (this.tree_is_dirty_)
      this.rebuild();

    item.dragging = true;
    item.drag_size = item.size;
    this.markChildren(item, (child) => { child.hide = true; });
  }

  tickDragging(item) {
    item.layout(this.ctx_);
    // We need to store the largest of the styled drag sizes,
    // to ensure we don't flip flop position when sizes change.
    item.drag_size[0] = Math.max(item.drag_size[0], item.size[0]);
    item.drag_size[1] = Math.max(item.drag_size[1], item.size[1]);
  }

  stopDragging(item) {
    if (this.tree_is_dirty_)
      this.rebuild();

    item.dragging = false;
    delete item.drag_size;
    this.markChildren(item, (child) => { child.hide = false; });
  }

  markChildren(item, mark) {
    for (let i = 0; i < item.children.length; ++i) {
      mark(item.children[i]);
      this.markChildren(item.children[i], mark);
    }
  }

  removeChildById(item, id) {
    for (let i = 0; i < item.children.length; ++i) {
      if (item.children[i].id == id) {
        item.children.splice(i, 1);
        break;
      }
    }
    for (let i = 0; i < item.descendants.length; ++i) {
      if (item.descendants[i] == id)
        item.descendants.splice(i, 1);
    }
  }

  insertChild(item, after_child, child) {
    if (!after_child) {
      item.children.splice(0, 0, child);
      item.descendants.splice(0, 0, child.id);
      return;
    }

    for (let i = 0; i < item.children.length; ++i) {
      if (item.children[i].id == after_child.id) {
        item.children.splice(i + 1, 0, child);
        break;
      }
    }
    for (let i = 0; i < item.descendants.length; ++i) {
      if (item.descendants[i] == after_child.id) {
        item.descendants.splice(i + 1, 0, child.id);
        break;
      }
    }
  }

  replaceChild(item, old_child_id, new_child) {
    let child_index = 0;
    for (let i = 0; i < item.children.length; ++i) {
      if (item.children[i].id == old_child_id) {
        child_index = i;
        break;
      }
    }
    item.children.splice(child_index, 1, new_child);

    let descendant_index = 0;
    for (let i = 0; i < item.descendants.length; ++i) {
      if (item.descendants[i] == old_child_id) {
        descendant_index = i;
        break;
      }
    }
    item.descendants.splice(descendant_index, 1, new_child.id);
  }

  removePlaceholder() {
    if (!this.placeholder_)
      return;
    this.placeholder_.held_item.tentative_parent = null;
    this.removeChildById(this.placeholder_.parent, this.placeholder_.id);
    this.placeholder_ = null;

    this.layout();
  }

  addPlaceholder(held_item, parent, after_child) {
    console.assert(!this.placeholder_);
    held_item.tentative_parent = parent;
    this.placeholder_ = new LayoutItem({ label: held_item.label, override_id: "placeholder" }, [0, 0]);
    this.placeholder_.held_item = held_item;
    this.placeholder_.parent = parent;
    this.placeholder_.children = [];
    this.insertChild(parent, after_child, this.placeholder_);
    this.placeholder_.box = { color: Theme.placeholderStyle.box.color };
    this.placeholder_.border = { color: Theme.placeholderStyle.border.color };
    this.placeholder_.edge = { color: Theme.placeholderStyle.edge.color };

    this.layout();
  }

  commitPlaceholder() {
    if (!this.placeholder_)
      return;
    const item = this.placeholder_.held_item;
    item.parent = item.tentative_parent;
    item.tentative_parent = null;
    // TODO(vmpstr): There is a problem with multiple ancestors here.
    item.ancestors = [item.parent.id];
    this.replaceChild(item.parent, this.placeholder_.id, item);
    this.removePlaceholder();

    this.rebuild();
  }
}
