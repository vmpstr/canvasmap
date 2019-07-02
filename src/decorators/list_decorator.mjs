import { Decorators } from './decorators.mjs';
import { Rect } from '../geometry/rect.mjs';
import { LayoutDecoratorContainer } from './layout_decorator_container.mjs';
import { Theme } from '../theme.mjs';
import { BoxDecoratorUtils } from './box_decorator_utils.mjs';

export class ListDecorator {
  constructor(anchor, behavior, settings) {
    console.assert(Decorators.validCombination(anchor, behavior));

    this.anchor_ = anchor;
    this.behavior_ = behavior;
    this.settings_ = settings;
    this.decorators_ = [];
  }

  override(anchor, behavior) {
    this.anchor_ = anchor;
    this.behavior_ = behavior;
  }

  layoutSize(border_rect, label_rect) {
    const total_size = [0, 0];
    // TODO(vmpstr): This is horizontal growth, need vertical too.
    for (let i = 0; i < this.decorators_.length; ++i) {
      const size = this.decorators_[i].layoutSize();
      total_size[0] += size[0];
      total_size[1] = Math.max(total_size[1], size[1]);
    }

    this.rect_ = new Rect([0, 0], total_size);
    const height = this.rect_.height + 2 * this.spacing;
    const width = this.rect_.width + 2 * this.spacing;

    return BoxDecoratorUtils.adjustBorderRect(this, width, height, border_rect, label_rect);
  }

  layoutPosition(border_rect, label_rect) {
    this.rect_ = BoxDecoratorUtils.layoutOwnRect(this, this.rect_, border_rect, label_rect);
    if (this.settings_.offset) {
      this.rect_.x += this.settings_.offset[0];
      this.rect_.y += this.settings_.offset[1];
    }

    for (let i = 0; i < this.decorators_.length; ++i) {
      this.decorators_[i].layoutPosition();
    }
  }

  addDecorator(decorator) {
    this.decorators_.push(new ListDecoratorItem(decorator));
  }

  get last_added() {
    return this.decorators_[this.decorators_.length - 1].decorator;
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
    let x = this.rect_.x;
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

    for (let i = 0; i < this.decorators_.length; ++i) {
      this.decorators_[i].rasterize(ctx, [x, y]);
      x += this.decorators_[i].rect.size[0];
    }
  }
}

class ListDecoratorItem {
  constructor(decorator) {
    this.decorator_ = decorator;
  }

  layoutSize() {
    const anchor = this.decorator_.anchor;
    const behavior = this.decorator_.behavior;
    this.decorator_.override(Decorators.anchor.center, Decorators.behavior.contained);

    this.rect_ = this.decorator_.layoutSize(new Rect([0, 0], [0, 0]), new Rect([0, 0], [0, 0]));

    this.decorator_.override(anchor, behavior);
    return this.rect_.size;
  }

  layoutPosition() {
    const anchor = this.decorator_.anchor;
    const behavior = this.decorator_.behavior;
    this.decorator_.override(Decorators.anchor.center, Decorators.behavior.contained);

    this.decorator_.layoutPosition(new Rect([0, 0], [0, 0]), new Rect([0, 0], [0, 0]));

    this.decorator_.override(anchor, behavior);
  }

  rasterize(ctx, position) {
    ctx.save();
    ctx.translate(position[0] - this.rect_.x, position[1] - this.rect_.y);
    this.decorator_.rasterize(ctx);
    ctx.restore();
  }

  get decorator() {
    return this.decorator_;
  }

  get rect() {
    return this.rect_;
  }

  get spacing() {
    return this.decorator_.spacing;
  }
}
