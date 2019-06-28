import { BoxDecorator } from './box_decorator.mjs';

export class Decorators {
  static create(type, anchor, behavior, settings) {
    switch (type) {
      case Decorators.type.box:
        return new BoxDecorator(anchor, behavior, settings);
      case Decorators.type.icon:
      case Decorators.type.text:
        console.assert(false);
    }
  }

  static validCombination(anchor, behavior) {
    // These are the only implemented combinations. Some combinations don't
    // make sense (e.g. excluded center), whereas some are just not
    // implemented (contained anything but right).
    if (behavior == Decorators.behavior.floating)
      return true;
    if (behavior == Decorators.behavior.excluded)
      return anchor != Decorators.anchor.center;
    if (behavior == Decorators.behavior.contained)
      return anchor == Decorators.anchor.bottom || anchor == Decorators.anchor.right;
  }
}

Decorators.type = {
  box: "box",
  icon: "icon",
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
