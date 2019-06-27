import { Theme } from './theme.mjs';

export class LayoutItem {
  constructor(item, position) {
    this.data_item_ = item;
    item.construct(this);
    this.position_ = position;
  }

  layout(ctx, pending_label) {
    ctx.font = Theme.fontStyle(this);
    const text_width = ctx.measureText(pending_label !== undefined ? pending_label : this.label_).width;
    const width = Math.max(2 * Theme.padding(this) + text_width, Theme.minWidth(this));
    const height = Math.max(2 * Theme.padding(this) + Theme.fontSize(this), Theme.minHeight(this));
    this.size_ = [width, height];
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
}
