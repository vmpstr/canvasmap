let next_context_id_ = 1;

/*
 - id
 - name
 - (list) top level items
 - worklog
 - timeline
*/
export class Context {
  constructor(name) {
    this.id_ = next_context_id_++;
    this.name_ = name || "";
    this.items_ = [];
    // TODO(vmpstr): implement these.
    this.worklog_ = null;
    this.timeline_ = null;

    this.change_observers_ = [];
  }

  get id() {
    return this.id_;
  }

  get name() {
    return this.name_;
  }
  set name(v) {
    this.name_ = v;
    this.notifyObservers_();
  }

  // ----- Items.
  get items() {
    return this.items_;
  }
  addItem(item) {
    console.assert(this.items_.indexOf(item) == -1);
    this.items_.push(item);
    this.notifyObservers_();
  }
  removeItem(item) {
    const i = this.items_.indexOf(item);
    console.assert(i >= 0);
    this.items_.splice(i, 1);
    this.notifyObservers_();
  }

  // ----- Observers.
  addObserver(observer) {
    this.change_observers_.push(observer);
  }
  removeObserver(observer) {
    const i = this.change_observers_.indexOf(observer);
    if (i >= 0)
      this.change_observers_.splice(i, 1);
  }
  notifyObservers_() {
    this.change_observers_.forEach((observer) => {
      observer.notifyContextChanged(this);
    });
  }
};
