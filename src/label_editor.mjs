import { Theme } from './theme.mjs';
import { RunLoop } from './run_loop.mjs';

export class LabelEditor {
  constructor(app_canvas, item) {
    this.item_ = item;
    this.app_canvas_ = app_canvas;
    this.createInputAndAppend();
  }

  get item() {
    return this.item_;
  }

  createInputAndAppend() {
    this.input_ = document.createElement("input");
    this.input_.style = this.generateInputStyle();
    this.input_.id = LabelEditor.input_id;
    this.input_.value = this.item_.label;
    this.input_.addEventListener("keyup", (e) => this.handleOnKeyUp(e));
    this.input_.addEventListener("input", (e) => this.handleOnInput(e));
    document.body.appendChild(this.input_);
    this.input_.focus();
  }

  generateInputStyle() {
    let left = this.item_.position[0] + this.item_.label_offset[0] + this.app_canvas_.scroll_offset[0] / this.app_canvas_.zoom - 1;
    let top = this.item_.position[1] + this.item_.label_offset[1] + this.app_canvas_.scroll_offset[1]  / this.app_canvas_.zoom - (0.5 * Theme.fontSize(this.item_) + 4);
    left *= this.app_canvas_.zoom;
    top *= this.app_canvas_.zoom;

    let result = "position: absolute;"
    result += "transform-origin: top left;"
    result += "transform: scale(" + this.app_canvas_.zoom + ");";
    result += "font: " + Theme.fontStyle(this.item_) + ";";
    result += "left: " + left + "px;";
    result += "top: " + top + "px;";
    result += "width: " + Math.max(5, this.item_.label_width) + "px;";
    return result;
  }

  handleOnKeyUp(e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Enter")
      this.commitEdit();
    else if (e.key === "Escape")
      this.abortEdit();
  }

  handleOnInput(e) {
    this.item_.layout(this.app_canvas_.ctx, this.input_.value);
    this.input_.style.width = Math.max(5, this.item_.label_width) + "px";
    RunLoop.postTaskAndDraw();
  }

  commitEdit() {
    if (!this.item_ || !this.input_)
      return;
    this.item_.label = this.input_.value;
    this.dispose();
  }

  abortEdit() {
    if (!this.item_)
      return;
    this.dispose();
  }

  dispose() {
    if (!this.input_)
      return;
    this.input_.remove();
    this.item_.layout(this.app_canvas_.ctx);
    RunLoop.postTaskAndDraw(() => {
      this.app_canvas_.finishEdit();
      this.item_ = null;
    });
    this.input_ = null;
  }

  get disposed() {
    return !this.input_;
  }
}

LabelEditor.input_id = "LabelEditor_input_id";
