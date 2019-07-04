import { Theme } from './theme.mjs';
import { Rect } from './geometry/rect.mjs';
import { LayoutDecoratorContainer } from './decorators/layout_decorator_container.mjs';

export class LayoutItem {
  constructor(item, position) {
    this.data_item_ = item;
    this.decorators_ = new LayoutDecoratorContainer();
    this.position_ = position;
    this.label_offset_ = [0, 0];
    this.label_width_ = 0;

    // Has to be the last call, since it depends on the rest of the constructor.
    item.construct(this);
    this.needs_layout_ = false;
    this.selection_ = "none";
  }

  layout(ctx, pending_label) {
    this.needs_layout_ = false;

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

  layoutDecorators(ctx) {
    // TODO(vmpstr): Store a rect on this item.
    let border_rect = this.decorators_.layoutSize(
      ctx,
      new Rect(this.position_.slice(), this.size_.slice()),
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

  get position() { 
    console.assert(!this.needs_layout_);
    return this.position_;
  }

  set position(v) {
    this.position_ = v;
    this.needs_layout_ = true;
  }

  get bounding_box() {
    console.assert(!this.needs_layout_);
    let rect = new Rect(this.position_.slice(), this.size_.slice());
    let decorators_bounds = this.decorators_.bounding_box;
    if (decorators_bounds) {
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

  getClickableDecoratorAtPoint(p) {
    return this.decorators_.getClickableDecoratorAtPoint(p);
  }

  get size() {
    console.assert(!this.needs_layout_);
    return this.size_;
  }

  get label() {
    return this.label_;
  }

  set label(v) {
    this.label_ = v;
    this.needs_layout_ = true;
  }

  get ancestors() {
    return this.ancestors_;
  }

  set ancestors(v) {
    this.ancestors_ = v;
  }

  get descendants() {
    return this.descendants_;
  }

  set descendants(v) {
    this.descendants_ = v;
  }

  get id() {
    return this.data_item_.id_namespace + this.data_item_.local_id;
  }

  get data_item() {
    return this.data_item_;
  }

  get has_parent() {
    return !!(this.parent || this.tentative_parent || this.has_placeholder_parent);
  }

  get decorators() {
    return this.decorators_;
  }

  get label_offset() {
    return this.label_offset_;
  }

  get label_width() {
    return this.label_width_;
  }

  markSelection(v) {
    this.selection_ = v;
  }

  get selection() {
    return this.selection_;
  }
}
