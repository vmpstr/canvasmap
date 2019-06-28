import { Decorators } from './decorators.mjs';

export class LayoutDecoratorContainer {
  constructor(decorated_item) {
    this.decorator_map_ = {};
    const values = Object.values(Decorators.behavior);
    for (let i = 0; i < values.length; ++i) {
      this.decorator_map_[values[i]] = {}; 
    }
    this.decorated_item_ = decorated_item;
  }

  addDecorator(decorator) {
    const anchor = decorator.anchor;
    const behavior = decorator.behavior;
    console.assert(Decorators.validCombination(anchor, behavior));
    // Only one decorator per slot is allowed, use decorator containers
    // otherwise.
    console.assert(!this.decorator_map_[behavior][anchor]);
    decorator.decorated_item = this.decorated_item_;
    this.decorator_map_[behavior][anchor] = decorator;
    this.last_added_ = decorator;
  }

  get last_added() {
    return this.last_added_;
  }

  getAt(anchor, behavior) {
    return this.decorator_map_[behavior][anchor];
  }

  layoutSize(border_rect) {
    for (const [behavior, decorators] of Object.entries(this.decorator_map_)) {
      if (!decorators)
        continue;

      for (const [anchor, decorator] of Object.entries(decorators)) {
        border_rect = decorator.layoutSize(border_rect);
      }
    }
    return border_rect;
  }

  layoutPosition(border_rect) {
    // After the sizes are laid out, our border rect is fixed, so now we can layout
    // for position.
    for (const [behavior, decorators] of Object.entries(this.decorator_map_)) {
      if (!decorators)
        continue;

      for (const [anchor, decorator] of Object.entries(decorators)) {
        decorator.layoutPosition(border_rect);
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
}
