import { Decorators } from './decorators.mjs';
import { Rect } from '../geometry/rect.mjs';
import { LayoutDecoratorContainer } from './layout_decorator_container.mjs';
import { Theme } from '../theme.mjs';
import { BoxDecoratorUtils } from './box_decorator_utils.mjs'

export class TextDecorator {
  constructor(anchor, behavior, settings) {
    console.assert(Decorators.validCombination(anchor, behavior));
    this.anchor_ = anchor;
    this.behavior_ = behavior;
    this.settings_ = settings;
    this.decorators_ = new LayoutDecoratorContainer();
  }

  override(anchor, behavior) {
    this.anchor_ = anchor;
    this.behavior_ = behavior;
  }

  layoutSize(ctx, border_rect, label_rect) {
    ctx.font = this.settings_.font_size + "px " + this.settings_.font_face;
    const text_width = ctx.measureText(this.settings_.label || "").width;
    const text_height = this.settings_.font_size;
    this.rect_ = new Rect([0, 0], [text_width, text_height]);
    this.label_rect_ = new Rect(this.rect_.position.slice(), this.rect_.size.slice());
    this.rect_ = this.decorators_.layoutSize(ctx, this.rect_, this.label_rect_);

    const height = this.rect_.height + 2 * this.spacing;
    const width = this.rect_.width + 2 * this.spacing;

    return BoxDecoratorUtils.adjustBorderRect(this, width, height, border_rect, label_rect);
  }

  layoutPosition(ctx, border_rect, label_rect) {
    const old_position = this.rect_.position.slice();
    this.rect_ = BoxDecoratorUtils.layoutOwnRect(this, this.rect_, border_rect, label_rect);
    if (this.settings_.offset) {
      this.rect_.x += this.settings_.offset[0];
      this.rect_.y += this.settings_.offset[1];
    }
    // Need to shift the label position since we have shifted the rect position above.
    this.label_rect_.position[0] += this.rect_.position[0] - old_position[0];
    this.label_rect_.position[1] += this.rect_.position[1] - old_position[1];
    this.decorators_.layoutPosition(ctx, this.rect_, this.label_rect_);
  }

  addDecorator(decorator) {
    this.decorators_.addDecorator(decorator);
  }

  get last_added() {
    return this.decorators_.last_added;
  }

  getAt(anchor, behavior) {
    return this.decorators_.getAt(anchor, behavior);
  }

  get anchor() {
    return this.anchor_;
  }

  get behavior() {
    return this.behavior_;
  }

  get spacing() {
    return this.settings_.margin || 0;
  }

  rasterize(ctx) {
    ctx.font = this.settings_.font_size + "px " + this.settings_.font_face;
    if (this.settings_.font_color) {
      ctx.fillStyle = this.settings_.font_color;
    } else {
      ctx.fillStyle = "black";
    }

    ctx.beginPath();
    ctx.textBaseline = "middle";
    ctx.fillText(this.settings_.label, this.rect_.x, this.rect_.y + 0.5 * this.rect_.height);

    if (this.decorators_)
      this.decorators_.rasterize(ctx);
  }

  set decorators(v) {
    this.decorators_ = v;
  }

  get decorators() {
    return this.decorators_;
  }
}
