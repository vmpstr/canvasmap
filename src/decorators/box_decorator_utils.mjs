import { Rect } from '../geometry/rect.mjs';
import { Decorators } from './decorators.mjs';

export class BoxDecoratorUtils {
  static adjustBorderRect(decorator, width, height, border_rect, label_rect) {
    if (decorator.behavior != Decorators.behavior.contained)
      return border_rect;

    switch(decorator.anchor) {
      case Decorators.anchor.top:
        if (height > label_rect.top - border_rect.top) { 
          const extra_height = height - (label_rect.top - border_rect.top);
          border_rect.y -= extra_height;
          border_rect.height += extra_height;
        }
        if (width > border_rect.width) {
          const extra_width = width - border_rect.width;
          border_rect.width += extra_width;
          border_rect.x -= 0.5 * extra_width;
        }
        break;
      case Decorators.anchor.bottom:
        if (height > border_rect.bottom - label_rect.bottom) {
          const extra_height = height - (border_rect.bottom - label_rect.bottom);
          border_rect.height += extra_height;
        }
        if (width > border_rect.width) {
          const extra_width = height - border_rect.width;
          border_rect.width += extra_width;
          border_rect.x -= 0.5 * extra_width;
        }
        break;
      case Decorators.anchor.left:
        if (width > label_rect.left - border_rect.left) {
          const extra_width = width - (label_rect.left - border_rect.left);
          border_rect.x -= extra_width;
          border_rect.width += extra_width;
        }
        if (height > border_rect.height) {
          const extra_height = height - border_rect.height;
          border_rect.height += extra_height;
          border_rect.y -= 0.5 * extra_height;
        }
        break;
      case Decorators.anchor.right:
        if (width > border_rect.right - label_rect.right) {
          const extra_width = width - (border_rect.right - label_rect.right);
          border_rect.width += extra_width;
        }
        if (height > border_rect.height) {
          const extra_height = height - border_rect.height;
          border_rect.height += extra_height;
          border_rect.y -= 0.5 * extra_height;
        }
        break;
      case Decorators.anchor.center:
        // Center is the only one that unconditionally bumps up the sizes,
        // since it's hard to reason about available space when placing a thing
        // in the middle of where the label rect is... This really should only
        // be used for nested decorators.
        border_rect.width += width
        border_rect.x -= 0.5 * width;
        border_rect.height += height;
        border_rect.y -= 0.5 * height;
        break;
      case Decorators.anchor.bottom_left:
      case Decorators.anchor.bottom_right:
      case Decorators.anchor.top_left:
      case Decorators.anchor.top_right:
        console.assert(false);
        break;
    }
    return border_rect;
  }

  static layoutOwnRect(decorator, own_rect, border_rect, label_rect) {
    switch(decorator.behavior) {
      case Decorators.behavior.contained:
        return BoxDecoratorUtils.layoutPositionContained(decorator, own_rect, border_rect, label_rect);
      case Decorators.behavior.excluded:
        return BoxDecoratorUtils.layoutPositionExcluded(decorator, own_rect, border_rect, label_rect);
      case Decorators.behavior.floating:
        return BoxDecoratorUtils.layoutPositionFloating(decorator, own_rect, border_rect, label_rect);
    }
  }

  static layoutPositionContained(decorator, own_rect, border_rect, label_rect) {
    switch(decorator.anchor) {
      case Decorators.anchor.top:
        own_rect.x = 0.5 * (label_rect.left + label_rect.right) - 0.5 * own_rect.width;
        own_rect.y = label_rect.top - own_rect.height - decorator.spacing;
        break;
      case Decorators.anchor.bottom:
        own_rect.x = 0.5 * (label_rect.left + label_rect.right) - 0.5 * own_rect.width;
        own_rect.y = label_rect.bottom + decorator.spacing;
        break;
      case Decorators.anchor.left:
        own_rect.x = label_rect.left - own_rect.width - decorator.spacing;
        own_rect.y = 0.5 * (label_rect.top + label_rect.bottom) - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.right:
        own_rect.x = label_rect.right + decorator.spacing;
        own_rect.y = 0.5 * (label_rect.top + label_rect.bottom) - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.center:
        own_rect.x = 0.5 * (label_rect.left + label_rect.right) - 0.5 * own_rect.width;
        own_rect.y = 0.5 * (label_rect.top + label_rect.bottom) - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.top_left:
      case Decorators.anchor.top_right:
      case Decorators.anchor.bottom_left:
      case Decorators.anchor.bottom_right:
        console.assert(false);
        break;
    }
    return own_rect;
  }

  static layoutPositionExcluded(decorator, own_rect, border_rect, label_rect) {
    switch(decorator.anchor) {
      case Decorators.anchor.top:
        own_rect.x = 0.5 * (border_rect.left + border_rect.right) - 0.5 * own_rect.width;
        own_rect.y = border_rect.top - own_rect.height - decorator.spacing;
        break;
      case Decorators.anchor.bottom:
        own_rect.x = 0.5 * (border_rect.left + border_rect.right) - 0.5 * own_rect.width;
        own_rect.y = border_rect.bottom + decorator.spacing;
        break;
      case Decorators.anchor.left:
        own_rect.x = border_rect.left - own_rect.width - decorator.spacing;
        own_rect.y = 0.5 * (border_rect.top + border_rect.bottom) - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.right:
        own_rect.x = border_rect.right + decorator.spacing;
        own_rect.y = 0.5 * (border_rect.top + border_rect.bottom) - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.bottom_left:
      case Decorators.anchor.bottom_right:
      case Decorators.anchor.top_left:
      case Decorators.anchor.top_right:
      case Decorators.anchor.center:
        console.assert(false);
        break;
    }
    return own_rect;
  }

  static layoutPositionFloating(decorator, own_rect, border_rect, label_rect) {
    switch(decorator.anchor) {
      case Decorators.anchor.bottom:
        own_rect.x = 0.5 * (border_rect.left + border_rect.right) - 0.5 * own_rect.width
        own_rect.y = border_rect.bottom - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.bottom_left:
        own_rect.x = border_rect.left - 0.5 * own_rect.width;
        own_rect.y = border_rect.bottom - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.bottom_right:
        own_rect.x = border_rect.right - 0.5 * own_rect.width;
        own_rect.y = border_rect.bottom - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.center:
        own_rect.x = 0.5 * (border_rect.left + border_rect.right) - 0.5 * own_rect.width;
        own_rect.y = 0.5 * (border_rect.top + border_rect.bottom) - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.left:
        own_rect.x = border_rect.left - 0.5 * own_rect.width;
        own_rect.y = 0.5 * (border_rect.top + border_rect.bottom) - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.right:
        own_rect.x = border_rect.right - 0.5 * own_rect.width;
        own_rect.y = 0.5 * (border_rect.top + border_rect.bottom) - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.top_left:
        own_rect.x = border_rect.left - 0.5 * own_rect.width;
        own_rect.y = border_rect.top - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.top_right:
        own_rect.x = border_rect.right - 0.5 * own_rect.width;
        own_rect.y = border_rect.top - 0.5 * own_rect.height;
        break;
      case Decorators.anchor.top:
        own_rect.x = 0.5 * (border_rect.left + border_rect.right) - 0.5 * own_rect.width
        own_rect.y = border_rect.top - 0.5 * own_rect.height;
        break;
    }
    return own_rect;
  }

}
