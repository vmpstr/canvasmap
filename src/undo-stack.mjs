let Nodes;
let initialized = false;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  Nodes = await import(`./nodes.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
}

class Transaction {
  constructor(target) {
    this.target_ = target;
  }

  set target(v) {
    this.target_ = v;
  }
  get target() {
    return this.target_;
  }

  apply() {
    console.error("unimplemented apply()");
  }

  undo() {
    console.error("unimplemented undo()");
  }

  done() {
    console.error("unimplemented done()");
  }
};

class LabelChangeTransaction extends Transaction {
  constructor(target) {
    super(target);
    this.oldLabel_ = super.target.label;
  }

  apply() {
    super.target.label = this.newLabel_;
    super.target.select();
  }

  undo() {
    super.target.label = this.oldLabel_;
    super.target.select();
  }

  done() {
    this.newLabel_ = super.target.label;
    return this.oldLabel_ != this.newLabel_;
  }
};

class MoveTransaction extends Transaction {
  constructor(target) {
    super(target);
    this.oldData_ = this.getData();
  }

  getData() {
    return {
      map: super.target.map,
      parent: super.target.parent,
      position: super.target.position.slice(),
      ordinal: Nodes.childOrdinal(super.target, super.target.parent)
    }
  }

  apply() {
    super.target.map = this.newData_.map;
    super.target.position = this.newData_.position;
    this.newData_.parent.adoptNode(super.target, this.newData_.ordinal);
    super.target.select();
  }

  undo() {
    super.target.map = this.oldData_.map;
    super.target.position = this.oldData_.position;
    this.oldData_.parent.adoptNode(super.target, this.oldData_.ordinal);
    super.target.select();
  }

  done() {
    this.newData_ = this.getData();
    return this.oldData_.map != this.newData_.map ||
           this.oldData_.parent != this.newData_.parent ||
           this.oldData_.position[0] != this.newData_.position[0] ||
           this.oldData_.position[1] != this.newData_.position[1] ||
           this.oldData_.ordinal != this.newData_.ordinal;
  }
};

class CreateTransaction extends Transaction {
  constructor(target) {
    super(target);
  }

  apply() {
    super.target.map = this.data_.map;
    super.target.position = this.data_.position;
    this.data_.parent.adoptNode(super.target, this.data_.ordinal);
    super.target.select();
  }

  undo() {
    super.target.remove();
  }

  done() {
    this.data_ = {
      map: super.target.map,
      parent: super.target.parent,
      position: super.target.position.slice(),
      ordinal: Nodes.childOrdinal(super.target, super.target.parent)
    };
    return true;
  }
};

class DeleteTransaction extends Transaction {
  constructor(target) {
    super(target);
    this.data_ = {
      map: super.target.map,
      parent: super.target.parent,
      position: super.target.position.slice(),
      ordinal: Nodes.childOrdinal(super.target, super.target.parent)
    };
  }

  apply() {
    if (super.target.parent)
      super.target.parent.select();
    super.target.remove();
  }

  undo() {
    super.target.map = this.data_.map;
    super.target.position = this.data_.position;
    this.data_.parent.adoptNode(super.target, this.data_.ordinal);
    super.target.select();
  }

  done() {
    this.data_ = {
      map: super.target.map,
      parent: super.target.parent,
      position: super.target.position.slice(),
      ordinal: Nodes.childOrdinal(super.target, super.target.parent)
    };
    return true;
  }
};

class SizeHandleDragTransaction extends Transaction {
  constructor(target) {
    super(target);
    this.oldInfo_ = super.target.getSizingInfo();
  }

  apply() {
    super.target.setSizingInfo(this.newInfo_);
  }

  undo() {
    super.target.setSizingInfo(this.oldInfo_);
  }

  done() {
    this.newInfo_ = super.target.getSizingInfo();
    return true;
  }
};

class ConvertTransaction extends Transaction {
  constructor(target, clone) {
    super(target);
    this.clone_ = clone;
  }

  apply() {
    super.target.convertToType(this.clone_.node_type, this.clone_);
    this.clone_.select();
  }

  undo() {
    this.clone_.convertToType(this.target.node_type, this.target);
    super.target.select();
  }

  done() {
    return true;
  }
};

export class UndoStack {
  constructor() {
    this.currentTransaction_ = null;
    this.undoStack_ = [];
    this.redoStack_ = [];
    this.blockTransactions_ = false;
  }

  handleKeyDown(e) {
    if (e.key == 'z' && e.ctrlKey) {
      if (this.undoStack_.length) {
        const transaction = this.undoStack_.pop();
        this.blockTransactions_ = true;
        transaction.undo();
        this.blockTransactions_ = false;
        this.redoStack_.push(transaction);
      }
      return true;
    } else if (e.key == 'y' && e.ctrlKey) {
      if (this.redoStack_.length) {
        const transaction = this.redoStack_.pop();
        this.blockTransactions_ = true;
        transaction.apply();
        this.blockTransactions_ = false;
        this.undoStack_.push(transaction);
      }
      return true;
    }
    return false;
  }

  startLabelEdit(target) {
    console.assert(!this.currentTransaction_);
    this.currentTransaction_ = new LabelChangeTransaction(target);
  }
  endLabelEdit() {
    this.recordTransaction_();
  }

  startNodeDrag(target) {
    console.assert(!this.currentTransaction_);
    this.currentTransaction_ = new MoveTransaction(target);
  }
  setNodeDragTarget(newTarget) {
    // The clone is always a new node, so use CreateTransaction.
    this.currentTransaction_ = new CreateTransaction(newTarget);
  }
  endNodeDrag() {
    this.recordTransaction_();
  }

  didCreate(target) {
    console.assert(!this.currentTransaction_);
    this.currentTransaction_ = new CreateTransaction(target);
    this.recordTransaction_();
  }

  willDelete(target) {
    console.assert(!this.currentTransaction_);
    this.currentTransaction_ = new DeleteTransaction(target);
    this.recordTransaction_();
  }

  startSizeHandleDrag(target) {
    console.assert(!this.currentTransaction_);
    this.currentTransaction_ = new SizeHandleDragTransaction(target);
  }
  endSizeHandleDrag() {
    this.recordTransaction_();
  }

  didConvertTo(target, clone) {
    console.assert(!this.currentTransaction_);
    this.currentTransaction_ = new ConvertTransaction(target, clone);
    this.recordTransaction_();
  }


  recordTransaction_() {
    if (this.blockTransactions_)
      return;
    console.assert(this.currentTransaction_);
    if (this.currentTransaction_.done()) {
      this.undoStack_.push(this.currentTransaction_);
      this.redoStack_ = [];
    }
    this.currentTransaction_ = null;
  }
};
