'use strict';

import { Theme } from './theme.mjs';
import { Rect } from './geometry/rect.mjs';
import { Point } from './geometry/point.mjs';
import { LayoutDecoratorContainer } from './decorators/layout_decorator_container.mjs';

export class LayoutItem {
  constructor(layout, item, position) {
    this.data_item_ = item;
    this.decorators_ = new LayoutDecoratorContainer();
    this.position_ = position;
    this.label_offset_ = [0, 0];
    this.label_width_ = 0;
    this.layout_ = layout;
    this.needs_layout = true;
    // TODO(vmpstr): Add a selection enum.
    this.selection_ = "none";
    this.label_ = "";
    this.size_ = [0, 0];
    this.children_ = [];
    this.layout_style_ = "default";
    this.aux_ = {
      ancestors: [],
      descendants: [],
      has_placeholder_parent: false,
      hide: false,
    };

    // Has to be the last call, since it depends on the rest of the constructor.
    item.construct(this);
  }

  ////////////////////////////
  // Getters with no setters
  ////////////////////////////
  get id() {
    return this.data_item_.id_namespace + this.data_item_.local_id;
  }

  get data_item() {
    return this.data_item_;
  }

  get has_parent() {
    // TODO(vmpstr): Clean up these variables into setters and getters.
    return !!(this.parent || this.has_placeholder_parent);
  }

  get decorators() {
    return this.decorators_;
  }

  get label_offset() {
    console.assert(!this.needs_layout_);
    return this.label_offset_;
  }

  get label_width() {
    console.assert(!this.needs_layout_);
    return this.label_width_;
  }

  get size() {
    console.assert(!this.needs_layout_);
    return this.size_;
  }

  get bounding_box() {
    console.assert(!this.needs_layout_);
    let rect = new Rect(new Point(this.position_), this.size_.slice());
    let decorators_bounds = this.decorators_.bounding_box;
    if (decorators_bounds) {
      // TODO(vmpstr): Rect.union?
      const new_x = Math.min(rect.left, decorators_bounds.left);
      const new_y = Math.min(rect.top, decorators_bounds.top);
      const new_right = Math.max(rect.right, decorators_bounds.right);
      const new_bottom = Math.max(rect.bottom, decorators_bounds.bottom);
      rect.x = new_x;
      rect.y = new_y;
      rect.width = new_right - new_x;
      rect.height = new_bottom - new_y;
    }
    return rect;
  }

  ////////////////////////////
  // Getters with setters
  ////////////////////////////
  get layout_style() {
    return this.layout_style_;
  }
  set layout_style(v) {
    this.layout_style_ = v;
    this.needs_layout = true;
  }

  get label() {
    return this.label_;
  }
  set label(v) {
    this.label_ = v;
    this.needs_layout = true;
  }

  get parent() {
    return this.parent_;
  }
  set parent(v) {
    this.parent_ = v;
  }

  get children() {
    return this.children_;
  }
  set children(v) {
    this.children_ = v;
  }

  get selection() {
    return this.selection_;
  }
  markSelection(v) {
    this.selection_ = v;
  }

  get position() { 
    console.assert(!this.needs_layout_);
    return this.position_;
  }
  set position(v) {
    this.position_ = v;
    this.needs_layout = true;
  }

  get needs_layout() {
    return this.needs_layout_;
  }
  set needs_layout(v) {
    // Only |this| can clear layout value.
    console.assert(v);
    this.needs_layout_ = v;
    this.layout_.needs_layout = v;
  }

  get ancestors() {
    return this.aux_.ancestors;
  }
  set ancestors(v) {
    this.aux_.ancestors = v;
  }

  get descendants() {
    return this.aux_.descendants;
  }
  set descendants(v) {
    this.aux_.descendants = v;
  }

  get has_placeholder_parent() {
    return this.aux_.has_placeholder_parent;
  }
  set has_placeholder_parent(v) {
    this.aux_.has_placeholder_parent = v;
  }

  get hide() {
    return this.aux_.hide;
  }
  set hide(v) {
    this.aux_.hide = v;
  }

  ////////////////////////////
  // Other functionality 
  ////////////////////////////
  layout(ctx, pending_label) {
    this.needs_layout_ = false;
    if (this.layout_style_ == "default" || this.layout_style_ == "tree") {
      this.layoutAsTree(ctx, pending_label);
    } else if (this.layout_style_ == "list") {
      this.layoutAsList(ctx, pending_label);
    }
  }

  // Lays out and optionally positions the item, and returns the y offset
  // of the bottom of the last child in this item (ie the spot where the next
  // item can go)
  layoutSubtree(ctx, start_point) {
    // If we're given a start_point, it means our position is restricted
    // by the parent.
    if (start_point !== undefined) {
      console.assert(this.parent);
      this.position = start_point;
    }
    // Note that we have to layout after positioning, so that decorators
    // can properly position themselves during layout.
    this.layout(ctx);


    let child_x = this.position[0] + Theme.childIndent(this);
    let child_y = this.position[1] + this.size[1] + Theme.childSpacing(this);

    for (let i = 0; i < this.children.length; ++i) {
      child_y = this.children[i].layoutSubtree(ctx, [child_x, child_y]);
      child_y += Theme.childSpacing(this);
    }
    return child_y - Theme.childSpacing(this);
  }

  layoutAsTree(ctx, pending_label) {
    // If we're laying out the placeholder, then layout the held item instead and take
    // its size. This is to avoid putting decorators on placeholders.
    if (this.data_item_.local_id == "placeholder") {
      this.data_item_.held_item.layout(ctx, pending_label);
      this.size_ = this.data_item_.held_item.size;
      return;
    }

    ctx.font = Theme.fontStyle(this);
    this.label_width_ = ctx.measureText(pending_label !== undefined ? pending_label : this.label_).width;
    const width = Math.max(2 * Theme.padding(this) + this.label_width_, Theme.minWidth(this));
    const height = Math.max(2 * Theme.padding(this) + Theme.fontSize(this), Theme.minHeight(this));
    this.size_ = [width, height];
    this.layoutDecorators(ctx);
  }

  layoutAsList(ctx, pending_label) {
  }

  layoutDecorators(ctx) {
    // TODO(vmpstr): Store a rect on this item.
    let border_rect = this.decorators_.layoutSize(
      ctx,
      new Rect(new Point(this.position_), this.size_.slice()),
      new Rect([this.position_[0] + Theme.padding(this), this.position_[1] + Theme.padding(this)],
               [this.size_[0] - 2 * Theme.padding(this), this.size_[1] - 2 * Theme.padding(this)])
    );

    // The decorator could have changed the x/y of the rect. However, since we might be
    // restricted by parent positioning, we don't actually record the position change in
    // |this.position_|, instead adjust where the label offset would be.
    this.label_offset_ = [
      this.position_[0] - border_rect.position[0] + Theme.padding(this),
      this.position_[1] - border_rect.position[1] + Theme.padding(this) + 0.5 * Theme.fontSize(this)
    ];
    this.size_ = border_rect.size;

    const label_rect = new Rect(
      [this.position_[0] + this.label_offset_[0], this.position_[1] + this.label_offset_[1] - 0.5 * Theme.fontSize(this)],
      [this.label_width_, Theme.fontSize(this)]
    );
    this.decorators_.layoutPosition(ctx, new Rect(this.position_, this.size_), label_rect);
  }

  getClickableDecoratorAtPoint(p) {
    return this.decorators_.getClickableDecoratorAtPoint(p);
  }
}
