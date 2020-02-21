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
  #old_label;
  #new_label;

  constructor(target) {
    super(target);
    this.#old_label = super.target.label;
  }

  apply() {
    super.target.label = this.#new_label;
    super.target.select();
  }

  undo() {
    super.target.label = this.#old_label;
    super.target.select();
  }

  done() {
    this.#new_label = super.target.label;
    return this.#old_label != this.#new_label;
  }
};

function child_ordinal(child, parent) {
  const children = parent.children;
  for (let i = 0; i < children.length; ++i) {
    if (children[i] == child)
      return i;
  }
  return -1;
}

class MoveTransaction extends Transaction {
  #old_data;
  #new_data;

  constructor(target) {
    super(target);
    this.#old_data = this.getData();
  }

  getData() {
    return {
      map: super.target.map,
      parent: super.target.parent,
      position: super.target.position.slice(),
      ordinal: child_ordinal(super.target, super.target.parent)
    }
  }

  apply() {
    super.target.map = this.#new_data.map;
    super.target.position = this.#new_data.position;
    this.#new_data.parent.adoptNode(super.target, this.#new_data.ordinal);
    super.target.select();
  }

  undo() {
    super.target.map = this.#old_data.map;
    super.target.position = this.#old_data.position;
    this.#old_data.parent.adoptNode(super.target, this.#old_data.ordinal);
    super.target.select();
  }

  done() {
    this.#new_data = this.getData();
    return this.#old_data.map != this.#new_data.map ||
           this.#old_data.parent != this.#new_data.parent ||
           this.#old_data.position[0] != this.#new_data.position[0] ||
           this.#old_data.position[1] != this.#new_data.position[1] ||
           this.#old_data.ordinal != this.#new_data.ordinal;
  }
};

class CreateTransaction extends Transaction {
  #data;

  constructor(target) {
    super(target);
  }

  apply() {
    super.target.map = this.#data.map;
    super.target.position = this.#data.position;
    this.#data.parent.adoptNode(super.target, this.#data.ordinal);
    super.target.select();
  }

  undo() {
    super.target.remove();
  }

  done() {
    this.#data = {
      map: super.target.map,
      parent: super.target.parent,
      position: super.target.position.slice(),
      ordinal: child_ordinal(super.target, super.target.parent)
    };
    return true;
  }
};

class DeleteTransaction extends Transaction {
  #data;

  constructor(target) {
    super(target);
    this.#data = {
      map: super.target.map,
      parent: super.target.parent,
      position: super.target.position.slice(),
      ordinal: child_ordinal(super.target, super.target.parent)
    };
  }

  apply() {
    super.target.remove();
  }

  undo() {
    super.target.map = this.#data.map;
    super.target.position = this.#data.position;
    this.#data.parent.adoptNode(super.target, this.#data.ordinal);
    super.target.select();
  }

  done() {
    this.#data = {
      map: super.target.map,
      parent: super.target.parent,
      position: super.target.position.slice(),
      ordinal: child_ordinal(super.target, super.target.parent)
    };
    return true;
  }
};

class SizeHandleDragTransaction extends Transaction {
  #old_info;
  #new_info;

  constructor(target) {
    super(target);
    this.#old_info = super.target.getSizingInfo();
  }

  apply() {
    super.target.setSizingInfo(this.#new_info);
  }

  undo() {
    super.target.setSizingInfo(this.#old_info);
  }

  done() {
    this.#new_info = super.target.getSizingInfo();
    return true;
  }
};

export class UndoStack {
  #current_transaction = null;
  #undo_stack = [];
  #redo_stack = [];

  constructor() {}

  handleKeyDown(e) {
    if (e.key == 'z' && e.ctrlKey) {
      if (this.#undo_stack.length) {
        const transaction = this.#undo_stack.pop();
        transaction.undo();
        this.#redo_stack.push(transaction);
      }
      return true;
    } else if (e.key == 'y' && e.ctrlKey) {
      if (this.#redo_stack.length) {
        const transaction = this.#redo_stack.pop();
        transaction.apply();
        this.#undo_stack.push(transaction);
      }
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

  startNodeDrag(target) {
    console.assert(!this.#current_transaction);
    this.#current_transaction = new MoveTransaction(target);
  }
  endNodeDrag() {
    this.#recordTransaction();
  }

  didCreate(target) {
    console.assert(!this.#current_transaction);
    this.#current_transaction = new CreateTransaction(target);
    this.#recordTransaction();
  }

  willDelete(target) {
    console.assert(!this.#current_transaction);
    this.#current_transaction = new DeleteTransaction(target);
    this.#recordTransaction();
  }

  startSizeHandleDrag(target) {
    console.assert(!this.#current_transaction);
    this.#current_transaction = new SizeHandleDragTransaction(target);
  }
  endSizeHandleDrag() {
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
