import { Theme } from './theme.mjs';

export class LayoutItem {
  constructor(item, position) {
    this.label_ = item.label;
    this.id_ = item.override_id || this.getItemId(item);
    this.ancestors_ = item.blocking;
    this.descendants_ = item.blocked_on || [];
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

  get id() {
    return this.id_;
  }

  getItemId(item) {
    if (item.bug !== undefined)
      return item.bug;
    const id = LayoutItem.autogen_id_prefix + LayoutItem.autogen_next_id;
    ++LayoutItem.autogen_next_id;
    return id;
  }
}

LayoutItem.autogen_id_prefix = "LI";
LayoutItem.autogen_next_id = 1;
