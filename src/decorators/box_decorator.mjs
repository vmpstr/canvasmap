import { Decorators } from './decorators.mjs';
import { Rect } from '../geometry/rect.mjs';

export class BoxDecorator {
  constructor(anchor, behavior, settings) {
    console.assert(Decorators.validCombination(anchor, behavior));

    this.anchor_ = anchor;
    this.behavior_ = behavior;
    this.settings_ = settings;
    this.rect_ = new Rect([0, 0], this.settings_.size);
  }

  layout(border_rect) {
    switch(this.behavior_) {
      case Decorators.behavior.contained:
        this.layoutContained(border_rect);
      case Decorators.behavior.excluded:
        this.layoutExcluded(border_rect);
      case Decorators.behavior.floating:
        this.layoutFloating(border_rect);
    }
    if (this.decorators_) {
      for (let i = 0; i < this.decorators_.length; ++i) {
        this.decorators_[i].layout(this.rect_);
      }
    }
  }

  layoutContained(border_rect) {
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
    return border_rect;
  }

  layoutExcluded(border_rect) {
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
    return border_rect;
  }

  layoutFloating(border_rect) {
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
    return border_rect;
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

    if (this.decorators_) {
      for (let i = 0; i < this.decorators_.length; ++i) {
        this.decorators_[i].rasterize(ctx);
      }
    }
  }

  set decorators(v) {
    this.decorators_ = v;
  }

  get decorators() {
    return this.decorators_;
  }
}
