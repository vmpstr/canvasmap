let Nodes;
let Shortcuts;
let initialized = false;
export async function initialize(version) {
  if (initialized)
    return;
  initialized = true;
  Nodes = await import(`./nodes.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  Shortcuts = await import(`./shortcuts.mjs?v=${version()}`).then(
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

  canMerge() {
    return false;
  }
  merge(transaction) {
    console.error("unimplemented merge(transaction)");
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
    if (super.target.parent && super.target.parent.select)
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

class StyleChange extends Transaction {
  constructor(target, property) {
    super(target);
    this.property_ = property;
    this.old_value_ = super.target.style.getPropertyValue(this.property_);
  }

  canMerge(transaction) {
    if (transaction instanceof StyleChange)
      return transaction.property_ == this.property_;
    return false;
  }

  merge(transaction) {
    console.assert(this.canMerge(transaction));
    console.assert(this.new_value_ == transaction.old_value_);
    this.new_value_ = transaction.new_value_;
  }

  apply() {
    this.target.style.setProperty(this.property_, this.new_value_);
  }

  undo() {
    this.target.style.setProperty(this.property_, this.old_value_);
  }

  done() {
    this.new_value_ = super.target.style.getPropertyValue(this.property_);
    return this.old_value_ !== this.new_value_;
  }
};

class StyleHunkChange extends Transaction {
  constructor(target, properties) {
    super(target);
    this.old_values_ = {};
    for (let i = 0; i < properties.length; ++i) {
      const property = properties[i];
      this.old_values_[property] = super.target.style.getPropertyValue(property);
    }
  }

  apply() {
    for (let property in this.new_values_)
      this.target.style.setProperty(property, this.new_values_[property]);
  }

  undo() {
    for (let property in this.old_values_)
      this.target.style.setProperty(property, this.old_values_[property]);
  }

  done() {
    let changed = false;
    this.new_values_ = {};
    for (let property in this.old_values_) {
      this.new_values_[property] = super.target.style.getPropertyValue(property);
      changed = changed || this.old_values_[property] != this.new_values_[property];
    }
    return changed;
  }
};
export class UndoStack {
  constructor() {
    this.currentTransaction_ = null;
    this.undoStack_ = [];
    this.redoStack_ = [];
    this.blockTransactions_ = false;
    this.changeCallbacks_ = [];
    this.changeRequestId_ = null;
  }

  onChange(callback) {
    this.changeCallbacks_.push(callback);
  }

  handleKeyDown(e) {
    const action = Shortcuts.eventToAction(e);
    if (action == Shortcuts.action.kUndo) {
      if (this.undoStack_.length) {
        const transaction = this.undoStack_.pop();
        console.debug(transaction);
        this.blockTransactions_ = true;
        transaction.undo();
        this.blockTransactions_ = false;
        this.redoStack_.push(transaction);
        this.notifyChanged();
      }
      return true;
    } else if (action == Shortcuts.action.kRedo) {
      if (this.redoStack_.length) {
        const transaction = this.redoStack_.pop();
        console.debug(transaction);
        this.blockTransactions_ = true;
        transaction.apply();
        this.blockTransactions_ = false;
        this.undoStack_.push(transaction);
        this.notifyChanged();
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
    this.recordTransactionIfNeeded_();
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
    this.recordTransactionIfNeeded_();
  }

  didCreate(target) {
    console.assert(!this.currentTransaction_);
    this.currentTransaction_ = new CreateTransaction(target);
    this.recordTransactionIfNeeded_();
  }

  willDelete(target) {
    console.assert(!this.currentTransaction_);
    this.currentTransaction_ = new DeleteTransaction(target);
    this.recordTransactionIfNeeded_();
  }

  startSizeHandleDrag(target) {
    console.assert(!this.currentTransaction_);
    this.currentTransaction_ = new SizeHandleDragTransaction(target);
  }
  endSizeHandleDrag() {
    this.recordTransactionIfNeeded_();
  }

  didConvertTo(target, clone) {
    console.assert(!this.currentTransaction_);
    this.currentTransaction_ = new ConvertTransaction(target, clone);
    this.recordTransactionIfNeeded_();
  }

  willChangeStyle(target, property) {
    console.assert(!this.currentTransaction_);
    this.currentTransaction_ = new StyleChange(target, property);
  }
  willChangeStyleHunk(target, properties) {
    console.assert(!this.currentTransaction_);
    this.currentTransaction_ = new StyleHunkChange(target, properties);
  }
  didChangeStyle() {
    this.recordTransactionIfNeeded_();
  }

  recordTransactionIfNeeded_() {
    if (this.blockTransactions_)
      this.currentTransaction_ = null;

    if (!this.currentTransaction_)
      return;

    if (this.currentTransaction_.done()) {
      let merged = false;
      if (this.undoStack_.length) {
        const i = this.undoStack_.length - 1;
        if (this.undoStack_[i].canMerge(this.currentTransaction_)) {
          this.undoStack_[i].merge(this.currentTransaction_);
          merged = true;
        }
      }
      if (!merged)
        this.undoStack_.push(this.currentTransaction_);
      this.redoStack_ = [];
      this.notifyChanged();
    }
    this.currentTransaction_ = null;
  }

  notifyChanged() {
    if (this.changeRequestId_)
      cancelAnimationFrame(this.changeRequestId_);
    this.changeRequestId_ = requestAnimationFrame(() => {
      for (let i = 0; i < this.changeCallbacks_.length; ++i)
        this.changeCallbacks_[i]();
    });
  }
};
