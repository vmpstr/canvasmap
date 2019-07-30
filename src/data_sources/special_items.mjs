import { Theme } from '../theme.mjs';

export class UserItem {
  constructor() {
    this.local_id_ = UserItem.next_id;
    UserItem.next_id++;
  }

  construct(layout_item) {}

  get id_namespace() {
    return UserItem.id_namespace;
  }

  get local_id() {
    return this.local_id_;
  }
}

UserItem.id_namespace = "User";
UserItem.next_id = 1;

export class PlaceholderItem {
  constructor(held_item, tentative_parent) {
    this.held_item_ = held_item;
    this.held_item_.has_placeholder_parent = true;
    this.tentative_parent_ = tentative_parent;
  }
  construct(layout_item) {
    layout_item.label = this.held_item_.label;
    layout_item.box = { color: Theme.placeholderStyle.box.color };
    layout_item.border = { color: Theme.placeholderStyle.border.color };
    layout_item.edge = { color: Theme.placeholderStyle.edge.color };
    layout_item.font = { color: Theme.placeholderStyle.font.color };
  }

  release() {
    this.held_item_.has_placeholder_parent = false;
  }

  get id_namespace() {
    return "";
  }

  get local_id() {
    return "placeholder";
  }

  get held_item() {
    return this.held_item_;
  }

  get tentative_parent() {
    return this.tentative_parent_;
  }
}
