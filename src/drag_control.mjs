import { Layout } from './layout.mjs';
import { Theme } from './theme.mjs';
import { Rect } from './geometry/rect.mjs';

export class DragControl {
  constructor(layout) {
    this.layout_ = layout;
  }

  handleMouseDown(p) {
    const item = this.layout_.getItemAtPoint(p);
    if (item) {
      this.hook_info_ = {
        item: item,
        drag_offset: [0, 0]
      };
    }
    return false;
  }

  handleMouseMove(p, delta) {
    if (!this.drag_item_) {
      if (!this.hook_info_)
        return false;
      this.hook_info_.drag_offset[0] += delta[0];
      this.hook_info_.drag_offset[1] += delta[1];
      if (Math.abs(this.hook_info_.drag_offset[0]) > DragControl.dragThreshold ||
          Math.abs(this.hook_info_.drag_offset[1]) > DragControl.dragThreshold) {
        this.drag_item_ = this.hook_info_.item;
        this.layout_.startDragging(this.drag_item_);

        this.drag_item_.position[0] += this.hook_info_.drag_offset[0];
        this.drag_item_.position[1] += this.hook_info_.drag_offset[1];
        this.layout_.tickDragging(this.drag_item_);
        delete this.hook_info_;
      } else {
        return false;
      }
    } else {
      this.drag_item_.position[0] += delta[0];
      this.drag_item_.position[1] += delta[1];
      this.layout_.tickDragging(this.drag_item_);
    }

    const query_rect = new Rect(
      [this.drag_item_.position[0], this.drag_item_.position[1] - 0.5 * this.drag_item_.drag_size[1]],
      [this.drag_item_.drag_size[0], 0.5 * this.drag_item_.drag_size[1]]
    );
    
    const candidates = this.layout_.getItemsInRect(query_rect);
    if (!candidates.length) {
      this.layout_.removePlaceholder();
      return true;
    }
    let closest = candidates[0];
    for (let i = 1; i < candidates.length; ++i) {
      if ((candidates[i].position[1] > closest.position[1] && candidates[i].id != "placeholder") || closest.id == "placeholder")
        closest = candidates[i];
    }

    if (closest.id == "placeholder")
      return true;
    const childIndent = Math.min(Theme.childIndent(this.drag_item_) * 0.4, closest.size[0] * 0.5);
    this.layout_.removePlaceholder();

    // is child check.. root can hook anywhere, and _expanded_ children mean we want to be a child.
    if ((this.drag_item_.position[0] > closest.position[0] + childIndent) || !closest.parent || closest.children.length > 0) {
      this.layout_.addPlaceholder(this.drag_item_, closest);
    } else if (closest.parent && closest.parent.parent && this.drag_item_.position[0] + childIndent < closest.position[0]) {
      // TODO(vmpstr): parent parent parent?
      this.layout_.addPlaceholder(this.drag_item_, closest.parent.parent, closest.parent);
    } else if (closest.parent) {
      this.layout_.addPlaceholder(this.drag_item_, closest.parent, closest);
    }
    return true;
  }

  handleMouseUp() {
    delete this.hook_info_;
    if (this.drag_item_) {
      this.layout_.stopDragging(this.drag_item_);
      delete this.drag_item_;
      this.layout_.commitPlaceholder();
      this.layout_.layout();
      return true;
    }
    return false;
  }
}

DragControl.dragThreshold = 3;
