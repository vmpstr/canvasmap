import { LayoutItem } from './layout_item.mjs';
import { Theme } from './theme.mjs';
import { PlaceholderItem } from './data_sources/special_items.mjs';
import { Rect } from './geometry/rect.mjs';

export class Layout {
  constructor(ctx) {
    this.items_ = [];
    this.items_by_id_ = [];
    this.tree_ = {};
    this.last_item_ = undefined;
    this.tree_is_dirty_ = false;
    this.needs_layout_ = false;
    this.ctx_ = ctx;
  }

  ////////////////////////////
  // Getters 
  ////////////////////////////
  get last_item() {
    return this.last_item_;
  }

  get items() {
    return this.items_;
  }

  get tree() {
    return this.tree_;
  }

  get tree_is_dirty() {
    return this.tree_is_dirty_;
  }

  get needs_layout() {
    return this.needs_layout_;
  }
  set needs_layout(v) {
    console.assert(v);
    this.needs_layout_ = v;
  }

  get items_by_id() {
    return this.items_by_id_;
  }

  ////////////////////////////
  // Queries 
  ////////////////////////////
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
    return undefined;
  }

  getDecoratorAtPoint(p) {
    this.layoutIfNeeded();

    for (let i = 0; i < this.items_.length; ++i) {
      const item = this.items_[i];
      const bounding_box = item.bounding_box;
      if (p[0] > bounding_box.left &&
          p[1] > bounding_box.top &&
          p[0] < bounding_box.right &&
          p[1] < bounding_box.bottom) {
        const decorator = item.getClickableDecoratorAtPoint(p);
        if (decorator)
          return decorator;
      }
    }
  }

  getItemsInRect(rect) {
    this.layoutIfNeeded();

    let result = [];

    const item_intersects = (item) => {
      if (!item)
        return false;
      let irect = new Rect(item.position, item.size);
      return irect.left < rect.right &&
             irect.top < rect.bottom &&
             irect.right > rect.left &&
             irect.bottom > rect.top;
    }

    for (let i = 0; i < this.items_.length; ++i) {
      if (item_intersects(this.items_[i]))
        result.push(this.items_[i]);
    }
    if (item_intersects(this.placeholder_))
      result.push(this.placeholder_);
    return result;
  }

  ////////////////////////////
  // Item manipulation 
  ////////////////////////////
  addItem(item, position) {
    // TODO(vmpstr): Since the ID may be prefixed, need to figure out the
    // blocking stuff. Probably LayoutItem needs to convert blocked/blocking
    // ids to correct prefix based on item type.
    this.items_.push(new LayoutItem(this, item, position));
    this.last_item_ = this.items_[this.items_.length - 1];
    // Need to layout immediately, since we might be placing an edit
    // label input right away.
    this.last_item_.layout(this.ctx_);
    this.items_by_id_[this.last_item_.id] = this.last_item_;
    this.tree_is_dirty_ = true;
    return this.last_item_;
  }

  removeItem(item) {
    if (item.parent)
      this.removeChild(item.parent, item);
    // Recursively delete all children.
    for (let i = 0; i < item.children.length; ++i)
      this.removeItem(item.children[i]);
    for (let i = 0; i < this.items_.length; ++i) {
      if (this.items_[i] == item) {
        this.items_.splice(i, 1);
        break;
      }
    }
    if (this.last_item_ == item)
      this.last_item_ = undefined;
    delete this.items_by_id_[item.id];

    this.rebuild();
    this.needs_layout_ = true;
  }

  removeChild(item, child) {
    this.rebuildIfNeeded();
    this.needs_layout_ = true;

    for (let i = 0; i < item.children.length; ++i) {
      if (item.children[i].id == child.id) {
        item.children.splice(i, 1);
        break;
      }
    }
    for (let i = 0; i < item.descendants.length; ++i) {
      if (item.descendants[i] == child.id) {
        item.descendants.splice(i, 1);
        break;
      }
    }

    for (let i = 0; i < child.ancestors.length; ++i) {
      if (child.ancestors[i] == item.id) {
        child.ancestors.splice(i, 1);
        break;
      }
    }
    child.parent = undefined;
  }

  insertChild(item, after_child, child) {
    this.rebuildIfNeeded();
    this.needs_layout_ = true;

    child.parent = item;
    child.ancestors = [item.id];

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

  appendChild(item, child) {
    this.rebuildIfNeeded();
    this.needs_layout_ = true;

    this.insertChild(
      item,
      item.children.length ? item.children[item.children.length - 1]
                           : undefined, child);
  }

  replaceChild(item, old_child, new_child) {
    console.assert(old_child.parent.id === item.id);
    if (new_child.parent)
      this.removeChild(new_child.parent, new_child);
    console.assert(!new_child.parent);

    this.rebuildIfNeeded();
    this.needs_layout_ = true;

    let child_index = 0;
    for (let i = 0; i < item.children.length; ++i) {
      if (item.children[i].id == old_child.id) {
        child_index = i;
        break;
      }
    }
    item.children.splice(child_index, 1, new_child);

    let descendant_index = 0;
    for (let i = 0; i < item.descendants.length; ++i) {
      if (item.descendants[i] == old_child.id) {
        descendant_index = i;
        break;
      }
    }
    item.descendants.splice(descendant_index, 1, new_child.id);

    old_child.parent = undefined;
    for (let i = 0; i < old_child.ancestors.length; ++i) {
      if (old_child.ancestors[i].id === item.id) {
        old_child.ancestors.splice(i, 1);
        break;
      }
    }

    new_child.parent = item;
    new_child.ancestors = [item.id];
  }

  ////////////////////////////
  // Rebuilds + layouts
  ////////////////////////////
  rebuild() {
    this.tree_ = {};
    for (let i = 0; i < this.items_.length; ++i) {
      const item = this.items_[i];
      // TODO(vmpstr): What if ancestors aren't in the filtered view?
      if (!item.ancestors || item.ancestors.length == 0) {
        item.ancestors = [];
        item.parent = undefined;
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
      value.layoutSubtree(this.ctx_);
    this.needs_layout_ = false;
  }

  rebuildIfNeeded() {
    if (this.tree_is_dirty_)
      this.rebuild();
  }

  layoutIfNeeded() {
    this.rebuildIfNeeded();
    if (this.needs_layout_)
      this.layout();
  }

  ////////////////////////////
  // Dragging 
  ////////////////////////////
  startDragging(item) {
    // Start dragging essentially makes the item root and then relies on
    // placeholder code to actually position it.
    // TODO(vmpstr): Need to figure out this and maybe refactor / rework.
    if (item.parent) {
      // TODO(vmpstr): There is a problem if item has multiple ancestors,
      // thus multiple possible parents.
      item.ancestors = [];
      this.removeChild(item.parent, item);
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

    delete item.dragging;
    delete item.drag_size;
    this.markChildren(item, (child) => { child.hide = false; });
  }

  markChildren(item, mark) {
    for (let i = 0; i < item.children.length; ++i) {
      mark(item.children[i]);
      this.markChildren(item.children[i], mark);
    }
  }

  ////////////////////////////
  // Placeholder 
  ////////////////////////////
  removePlaceholder() {
    if (!this.placeholder_)
      return;
    if (this.placeholder_.parent)
      this.removeChild(this.placeholder_.parent, this.placeholder_);
    this.placeholder_.data_item.release();
    delete this.placeholder_;

    this.layout();
  }

  addPlaceholder(held_item, parent, after_child) {
    console.assert(!this.placeholder_);
    this.placeholder_ = new LayoutItem(
      this, new PlaceholderItem(held_item, parent), [0, 0]);
    this.placeholder_.parent = parent;
    this.placeholder_.children = [];
    this.insertChild(parent, after_child, this.placeholder_);

    this.layout();
  }

  commitPlaceholder() {
    if (!this.placeholder_)
      return;
    const item = this.placeholder_.data_item.held_item;
    item.parent = this.placeholder_.data_item.tentative_parent;
    // TODO(vmpstr): There is a problem with multiple ancestors here.
    this.replaceChild(item.parent, this.placeholder_, item);
    this.removePlaceholder();

    this.rebuild();
  }
}
