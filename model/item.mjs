/*
 - id
 - name
 - (opt) description
 - (list) links
 - (opt) worklog
 - (opt) timline?
 - (list) children (items, ordered?)
 -
 - (bp) context
 - (bp) parent
*/
let next_item_id_ = 1;

export class Item {
  constructor(name) {
    this.id_ = next_item_id_++;
    this.name_ = name || "";
  }

  get id() {
    return this.id_;
  }

  get name() {
    return this.name_;
  }
  set name(v) {
    if (v == this.name_)
      return;
    this.name_ = v;
  }
};
