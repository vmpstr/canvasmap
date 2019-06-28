import { Theme } from './theme.mjs';
import { Rect } from './geometry/rect.mjs';
import { LayoutDecoratorContainer } from './decorators/layout_decorator_container.mjs';

export class LayoutItem {
  constructor(item, position) {
    this.data_item_ = item;
    this.decorators_ = new LayoutDecoratorContainer(this);
    this.position_ = position;

    // Has to be the last call, since it depends on the rest of the constructor.
    item.construct(this);
  }

  layout(ctx, pending_label) {
    if (this.data_item_.local_id == "placeholder") {
      this.data_item_.held_item.layout(ctx, pending_label);
      this.size_ = this.data_item_.held_item.size;
      return;
    }

    ctx.font = Theme.fontStyle(this);
    const text_width = ctx.measureText(pending_label !== undefined ? pending_label : this.label_).width;
    const width = Math.max(2 * Theme.padding(this) + text_width, Theme.minWidth(this));
    const height = Math.max(2 * Theme.padding(this) + Theme.fontSize(this), Theme.minHeight(this));
    this.size_ = [width, height];
    this.layoutDecorators();
  }

  layoutDecorators() {
    // TODO(vmpstr): Store a rect on this item.
    let border_rect = this.decorators_.layoutSize(new Rect(this.position_, this.size_));
    this.decorators_.layoutPosition(border_rect);
    this.position_ = border_rect.position;
    this.size_ = border_rect.size;
  }

  get position() { 
    return this.position_;
  }

  set position(v) {
    this.position_ = v;
  }

  get size() {
    return this.size_;
  }

  get label() {
    return this.label_;
  }

  set label(v) {
    this.label_ = v;
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
}
