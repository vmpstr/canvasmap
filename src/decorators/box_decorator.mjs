import { Decorators } from './decorators.mjs';
import { Rect } from '../geometry/rect.mjs';
import { LayoutDecoratorContainer } from './layout_decorator_container.mjs';
import { Theme } from '../theme.mjs';

export class BoxDecorator {
  constructor(anchor, behavior, settings) {
    console.assert(Decorators.validCombination(anchor, behavior));

    this.anchor_ = anchor;
    this.behavior_ = behavior;
    this.settings_ = settings;
    this.rect_ = new Rect([0, 0], this.settings_.size.slice());
    this.decorators_ = new LayoutDecoratorContainer();
  }

  set decorated_item(v) {
    this.decorated_item_ = v;
  }

  layoutSize(border_rect) {
    this.rect_ = new Rect([0, 0], this.settings_.size.slice());
    this.rect_ = this.decorators_.layoutSize(this.rect_);
    if (this.behavior_ != Decorators.behavior.contained)
      return border_rect;

    switch(this.anchor_) {
      case Decorators.anchor.bottom:
        border_rect.height += this.rect_.height + 2 * this.spacing;
        break;
      case Decorators.anchor.left:
        border_rect.x -= this.rect_.width + 2 * this.spacing;
        // fallthrough.
      case Decorators.anchor.right:
        border_rect.width += this.rect_.width + 2 * this.spacing;
        break;
      case Decorators.anchor.center:
      case Decorators.anchor.bottom_left:
      case Decorators.anchor.bottom_right:
      case Decorators.anchor.top_left:
      case Decorators.anchor.top_right:
      case Decorators.anchor.top:
        break;
    }
    return border_rect;
  }

  layoutPosition(border_rect, label_rect) {
    switch(this.behavior_) {
      case Decorators.behavior.contained:
        this.layoutPositionContained(border_rect, label_rect);
        break;
      case Decorators.behavior.excluded:
        this.layoutPositionExcluded(border_rect, label_rect);
        break;
      case Decorators.behavior.floating:
        this.layoutPositionFloating(border_rect, label_rect);
        break;
    }
    this.decorators_.layoutPosition(this.rect_, this.rect_);
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

  layoutPositionContained(border_rect, label_rect) {
    switch(this.anchor_) {
      case Decorators.anchor.bottom:
        this.rect_.x = 0.5 * (label_rect.left + label_rect.right) - 0.5 * this.rect_.width;
        this.rect_.y = border_rect.bottom - this.rect_.height - this.spacing;
        if (this.decorated_item_)
          this.rect_.y -= 0.5 * Theme.padding(this.decorated_item_);
        break;
      case Decorators.anchor.right:
        this.rect_.x = border_rect.right - this.rect_.width - this.spacing;
        this.rect_.y = 0.5 * (label_rect.top + label_rect.bottom) - 0.5 * this.rect_.height;
        if (this.decorated_item_)
          this.rect_.x -= 0.5 * Theme.padding(this.decorated_item_);
        break;
      case Decorators.anchor.bottom_left:
      case Decorators.anchor.bottom_right:
      case Decorators.anchor.center:
      case Decorators.anchor.left:
      case Decorators.anchor.right:
        this.rect_.x = border_rect.left + this.spacing;
        this.rect_.y = 0.5 * (label_rect.top + label_rect.bottom) - 0.5 * this.rect_.height;
        if (this.decorated_item_)
          this.rect_.x += 0.5 * Theme.padding(this.decorated_item_);
        break;
      case Decorators.anchor.top_left:
      case Decorators.anchor.top_right:
      case Decorators.anchor.top:
        break;
    }
    if (this.settings_.offset) {
      this.rect_.x += this.settings_.offset[0];
      this.rect_.y += this.settings_.offset[1];
    }
  }

  layoutPositionExcluded(border_rect) {
    switch(this.anchor_) {
      case Decorators.anchor.bottom:
      case Decorators.anchor.bottom_left:
      case Decorators.anchor.bottom_right:
      case Decorators.anchor.center:
      case Decorators.anchor.left:
      case Decorators.anchor.right:
      case Decorators.anchor.top_left:
      case Decorators.anchor.top_right:
      case Decorators.anchor.top:
        break;
    }
    if (this.settings_.offset) {
      this.rect_.x += this.settings_.offset[0];
      this.rect_.y += this.settings_.offset[1];
    }
  }

  get spacing() {
    let result = this.settings_.margin || 0;
    if (this.settings_.stroke_width)
      result += this.settings_.stroke_width;
    else
      result += 1;
    return result;
  }

  layoutPositionFloating(border_rect) {
    switch(this.anchor_) {
      case Decorators.anchor.bottom:
        this.rect_.x = 0.5 * (border_rect.left + border_rect.right) - 0.5 * this.rect_.width
        this.rect_.y = border_rect.bottom - 0.5 * this.rect_.height;
        break;
      case Decorators.anchor.bottom_left:
        this.rect_.x = border_rect.left - 0.5 * this.rect_.width;
        this.rect_.y = border_rect.bottom - 0.5 * this.rect_.height;
        break;
      case Decorators.anchor.bottom_right:
        this.rect_.x = border_rect.right - 0.5 * this.rect_.width;
        this.rect_.y = border_rect.bottom - 0.5 * this.rect_.height;
        break;
      case Decorators.anchor.center:
        this.rect_.x = 0.5 * (border_rect.left + border_rect.right) - 0.5 * this.rect_.width;
        this.rect_.y = 0.5 * (border_rect.top + border_rect.bottom) - 0.5 * this.rect_.height;
        break;
      case Decorators.anchor.left:
        this.rect_.x = border_rect.left - 0.5 * this.rect_.width;
        this.rect_.y = 0.5 * (border_rect.top + border_rect.bottom) - 0.5 * this.rect_.height;
        break;
      case Decorators.anchor.right:
        this.rect_.x = border_rect.right - 0.5 * this.rect_.width;
        this.rect_.y = 0.5 * (border_rect.top + border_rect.bottom) - 0.5 * this.rect_.height;
        break;
      case Decorators.anchor.top_left:
        this.rect_.x = border_rect.left - 0.5 * this.rect_.width;
        this.rect_.y = border_rect.top - 0.5 * this.rect_.height;
        break;
      case Decorators.anchor.top_right:
        this.rect_.x = border_rect.right - 0.5 * this.rect_.width;
        this.rect_.y = border_rect.top - 0.5 * this.rect_.height;
        break;
      case Decorators.anchor.top:
        this.rect_.x = 0.5 * (border_rect.left + border_rect.right) - 0.5 * this.rect_.width
        this.rect_.y = border_rect.top - 0.5 * this.rect_.height;
        break;
    }
    if (this.settings_.offset) {
      this.rect_.x += this.settings_.offset[0];
      this.rect_.y += this.settings_.offset[1];
    }
  }

  rasterize(ctx) {
    if (this.settings_.background_color) {
      ctx.fillStyle = this.settings_.background_color;
    } else {
      ctx.fillStyle = "transparent";
    }
    if (this.settings_.stroke_color) {
      ctx.strokeStyle = this.settings_.stroke_color;
    } else {
      ctx.strokeStyle = "transparent";
    }
    if (this.settings_.stroke_width) {
      ctx.lineWidth = this.settings_.stroke_width;
    } else  {
      ctx.lineWidth = 1;
    }

    ctx.beginPath();
    const x = this.rect_.x;
    const y = this.rect_.y;
    const width = this.rect_.width;
    const height = this.rect_.height;
    let radius = 0;
    if (this.settings_.border_radius)
      radius = this.settings_.border_radius;

    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);

    ctx.fill();
    ctx.stroke();

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
