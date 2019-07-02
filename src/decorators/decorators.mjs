import { BoxDecorator } from './box_decorator.mjs';
import { ListDecorator } from './list_decorator.mjs';
import { TextDecorator } from './text_decorator.mjs';
import { ImageDecorator } from './image_decorator.mjs';

export class Decorators {
  static create(type, anchor, behavior, settings) {
    switch (type) {
      case Decorators.type.box:
        return new BoxDecorator(anchor, behavior, settings);
      case Decorators.type.list:
        return new ListDecorator(anchor, behavior, settings);
      case Decorators.type.text:
        return new TextDecorator(anchor, behavior, settings);
      case Decorators.type.image:
        return new ImageDecorator(anchor, behavior, settings);
    }
  }

  static validCombination(anchor, behavior) {
    // These are the only implemented combinations. Some combinations don't
    // make sense. Some are not implemented, because of no use cases.
    if (behavior == Decorators.behavior.floating)
      return true;
    if (behavior == Decorators.behavior.excluded) {
      return anchor == Decorators.anchor.bottom ||
             anchor == Decorators.anchor.right ||
             anchor == Decorators.anchor.left ||
             anchor == Decorators.anchor.top;
    }
    if (behavior == Decorators.behavior.contained) {
      return anchor == Decorators.anchor.bottom ||
             anchor == Decorators.anchor.right ||
             anchor == Decorators.anchor.left ||
             anchor == Decorators.anchor.top ||
             anchor == Decorators.anchor.center;
    }
  }
}

Decorators.type = {
  box: "box",
  image: "image",
  list: "list",
  text: "text",
}
  
Decorators.anchor = {
  bottom: "bottom",
  bottom_left: "bottom_left",
  bottom_right: "bottom_right",
  center: "center",
  left: "left",
  right: "right",
  top_left: "top_left",
  top_right: "top_right",
  top: "top",
}

Decorators.behavior = {
  contained: "contained",
  excluded: "excluded",
  floating: "floating",
}
