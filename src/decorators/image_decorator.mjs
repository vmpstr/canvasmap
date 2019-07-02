import { Decorators } from './decorators.mjs';
import { Rect } from '../geometry/rect.mjs';
import { LayoutDecoratorContainer } from './layout_decorator_container.mjs';
import { Theme } from '../theme.mjs';
import { BoxDecoratorUtils } from './box_decorator_utils.mjs'

export class ImageDecorator {
  constructor(anchor, behavior, settings) {
    console.assert(Decorators.validCombination(anchor, behavior));

    this.anchor_ = anchor;
    this.behavior_ = behavior;
    this.settings_ = settings;
    this.rect_ = new Rect([0, 0], this.settings_.size.slice());
    this.decorators_ = new LayoutDecoratorContainer();
  }

  override(anchor, behavior) {
    this.anchor_ = anchor;
    this.behavior_ = behavior;
  }

  layoutSize(ctx, border_rect, label_rect) {
    this.rect_ = new Rect([0, 0], this.settings_.size.slice());
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
    let result = this.settings_.margin || 0;
    if (this.settings_.stroke_width)
      result += this.settings_.stroke_width;
    else
      result += 1;
    return result;
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
    
    ctx.save();
    ctx.clip();

    ctx.drawImage(this.settings_.image, x, y, width, height);

    ctx.restore();
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
