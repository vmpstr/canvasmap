import { Decorators } from './decorators.mjs';
import { Rect } from '../geometry/rect.mjs';

export class LayoutDecoratorContainer {
  constructor() {
    this.decorator_map_ = {};
    const values = Object.values(Decorators.behavior);
    for (let i = 0; i < values.length; ++i) {
      this.decorator_map_[values[i]] = {}; 
    }
  }

  addDecorator(decorator) {
    const anchor = decorator.anchor;
    const behavior = decorator.behavior;
    console.assert(Decorators.validCombination(anchor, behavior));
    // Only one decorator per slot is allowed, use decorator containers
    // otherwise.
    console.assert(!this.decorator_map_[behavior][anchor]);
    this.decorator_map_[behavior][anchor] = decorator;
    this.last_added_ = decorator;
  }

  get last_added() {
    return this.last_added_;
  }

  getAt(anchor, behavior) {
    return this.decorator_map_[behavior][anchor];
  }

  layoutSize(ctx, border_rect, label_rect) {
    for (const [behavior, decorators] of Object.entries(this.decorator_map_)) {
      if (!decorators)
        continue;

      for (const [anchor, decorator] of Object.entries(decorators)) {
        border_rect = decorator.layoutSize(ctx, border_rect, label_rect);
      }
    }
    return border_rect;
  }

  layoutPosition(ctx, border_rect, label_rect) {
    // After the sizes are laid out, our border rect is fixed, so now we can layout
    // for position.
    for (const [behavior, decorators] of Object.entries(this.decorator_map_)) {
      if (!decorators)
        continue;

      for (const [anchor, decorator] of Object.entries(decorators)) {
        decorator.layoutPosition(ctx, border_rect, label_rect);
      }
    }
  }

  rasterize(ctx) {
    for (const [behavior, decorators] of Object.entries(this.decorator_map_)) {
      if (!decorators)
        continue;
      
      for (const [anchor, decorator] of Object.entries(decorators)) {
        decorator.rasterize(ctx);
      }
    }
  }

  get bounding_box() {
    let rect;
    for (const [behavior, decorators] of Object.entries(this.decorator_map_)) {
      if (!decorators)
        continue;

      for (const [anchor, decorator] of Object.entries(decorators)) {
        const bounding_box = decorator.bounding_box;
        if (!rect) {
          // TODO(vmpstr): Add Rect.clone
          rect = new Rect(bounding_box.position.slice(), bounding_box.size.slice());
        } else {
          const new_x = Math.min(rect.left, bounding_box.left);
          const new_y = Math.min(rect.top, bounding_box.top);
          const new_right = Math.max(rect.right, bounding_box.right);
          const new_bottom = Math.max(rect.bottom, bounding_box.bottom);
          rect.x = new_x;
          rect.y = new_y;
          rect.width = new_right - new_x;
          rect.height = new_bottom - new_y;
        }
      }
    }
    return rect;
  }

  getClickableDecoratorAtPoint(p) {
    let result;
    for (const [behavior, decorators] of Object.entries(this.decorator_map_)) {
      if (!decorators)
        continue;
      
      for (const [anchor, decorator] of Object.entries(decorators)) {
        let candidate = decorator.getClickableDecoratorAtPoint(p);
        result = result || candidate;
      }
    }
    return result;
  }
}
