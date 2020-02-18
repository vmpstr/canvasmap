class Transaction {
  #target = null;

  constructor(target) {
    this.#target = target;
  }

  set target(v) {
    this.#target = v;
  }
  get target() {
    return this.#target;
  }

  apply() {
    console.log("unimplemented apply()");
    console.assert(false);
  }

  undo() {
    console.log("unimplemented undo()");
    console.assert(false);
  }

  done() {
    console.log("unimplemented done()");
    console.assert(false);
  }
};

class LabelChangeTransaction extends Transaction {
  #original_label;
  #new_label;

  constructor(target) {
    super(target);
    this.#original_label = super.target.label;
  }

  done() {
    this.#new_label = super.target.label;
    console.log("label changed from " + this.#original_label + " to " + this.#new_label);
    return this.#original_label != this.#new_label;
  }
}

export class UndoStack {
  #current_transaction = null;
  #undo_stack = [];
  #redo_stack = [];

  constructor() {}

  handleKeyDown(e) {
    if (e.key == 'z' && e.ctrlKey) {
      return true;
    }
    return false;
  }

  startLabelEdit(target) {
    console.assert(!this.#current_transaction);
    this.#current_transaction = new LabelChangeTransaction(target);
  }
  endLabelEdit() {
    this.#recordTransaction();
  }

  #recordTransaction = () => {
    console.assert(this.#current_transaction);
    if (this.#current_transaction.done()) {
      this.#undo_stack.push(this.#current_transaction);
      this.#redo_stack = [];
    }
    this.#current_transaction = null;
  }
};
