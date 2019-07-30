'use strict';

import { RunLoop } from './run_loop.mjs';
import { LabelEditor } from './label_editor.mjs';
import { Point } from './geometry/point.mjs';

export class AppCanvas {
  // Constructor.
  constructor() {
    this.createCanvas();
    this.registerEventListeners();
    this.initializeSettings();
  }

  
  // Initialization functions.
  createCanvas() {
    this.canvas_ = document.createElement("canvas");
    this.canvas_.style = "padding: 0; border: 1px solid black";
    this.canvas_.width = window.innerWidth - 2;
    this.canvas_.height = window.innerHeight - 6;
    this.canvas_.id = "app_canvas";
    this.ctx_ = this.canvas_.getContext("2d");
    this.ctx_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);

    document.body.appendChild(this.canvas_);
  }

  registerEventListeners() {
    window.addEventListener("resize", () => this.resizeCanvas());

    this.mouseDownEvents_ = [];
    this.mouseUpEvents_ = [];
    this.mouseMoveEvents_ = [];
    this.clickEvents_ = [];
    this.doubleClickEvents_ = [];

    this.canvas_.addEventListener("mousedown", (e) => this.handleMouseEvent(e));
    this.canvas_.addEventListener("mouseup", (e) => this.handleMouseEvent(e));
    this.canvas_.addEventListener("mousemove", (e) => this.handleMouseEvent(e));
    this.canvas_.addEventListener("click", (e) => this.handleMouseEvent(e));
    this.canvas_.addEventListener("dblclick", (e) => this.handleMouseEvent(e));
  }

  initializeSettings() {
    const bounding_rect = this.canvas_.getBoundingClientRect();
    this.client_offset_ = new Point([bounding_rect.left, bounding_rect.top]);
    this.global_scroll_offset_ = [0, 0];

    this.ignore_clicks_ = false;
    this.last_local_mouse_position_ = [0, 0];
    this.last_global_mouse_position_ = [0, 0];

    this.label_editor_ = null;
    this.zoom_ = 1;
  }


  // Event responders.
  resizeCanvas() {
    this.canvas_.width = window.innerWidth - 2;
    this.canvas_.height = window.innerHeight - 6;
    RunLoop.postTaskAndDraw();
  }

  onZoomChanged() {
    this.last_local_mouse_position_ = this.globalToLocal(this.last_global_mouse_position_);
  }
        

  // Event registration and dispatch.
  addEventListener(event_name, f) {
    if (event_name.toLowerCase() == "mousedown") {
      this.mouseDownEvents_.push(f);
    } else if (event_name.toLowerCase() == "mousemove") {
      this.mouseMoveEvents_.push(f);
    } else if (event_name.toLowerCase() == "mouseup") {
      this.mouseUpEvents_.push(f);
    } else if (event_name.toLowerCase() == "click") {
      this.clickEvents_.push(f);
    } else if (event_name.toLowerCase() == "dblclick") {
      this.doubleClickEvents_.push(f);
    }
  }

  removeEventListener(event_name, f) {
    if (event_name.toLowerCase() == "mousedown") {
      this.removeEventListenerInternal(this.mouseDownEvents_, f);
    } else if (event_name.toLowerCase() == "mousemove") {
      this.removeEventListenerInternal(this.mouseMoveEvents_, f);
    } else if (event_name.toLowerCase() == "mouseup") {
      this.removeEventListenerInternal(this.mouseUpEvents_, f);
    } else if (event_name.toLowerCase() == "click") {
      this.removeEventListenerInternal(this.clickEvents_, f);
    } else if (event_name.toLowerCase() == "dblclick") {
      this.removeEventListenerInternal(this.doubleClickEvents_, f);
    }
  }

  removeEventListenerInternal(events, f) {
    for (let i = 0; i < events.length; ++i) {
      if (events[i] === f) {
        events.splice(i, 1);
        // May have multiple instances of the same f.
        i--;
      }
    }
  }

  handleMouseEvent(e) {
    e.preventDefault();
    e.stopPropagation();
    const p = this.globalToLocal([e.clientX, e.clientY]);

    const global_delta = [e.clientX - this.last_global_mouse_position_[0],
                          e.clientY - this.last_global_mouse_position_[1]];
    this.last_global_mouse_position_ = [e.clientX, e.clientY];
    if (e.type.toLowerCase() == "mousemove" && e.altKey && e.buttons == 1) {
      this.global_scroll_offset_[0] += global_delta[0];
      this.global_scroll_offset_[1] += global_delta[1];
      RunLoop.postTaskAndDraw();
      return;
    }

    let result = false;
    if (e.type.toLowerCase() == "mousedown") {
      for (let i = 0; i < this.mouseDownEvents_.length; ++i)
        this.mouseDownEvents_[i](p, e) || result;
    } else if (e.type.toLowerCase() == "mouseup") {
      for (let i = 0; i < this.mouseUpEvents_.length; ++i)
        result = this.mouseUpEvents_[i](p, e) || result;
      if (this.did_drag_) {
        this.canvas_.style.cursor = "default";
        this.ignoreClicks();
        this.did_drag_ = false;
      }
    } else if (e.type.toLowerCase() == "mousemove") {
      const delta = [p[0] - this.last_local_mouse_position_[0],
                     p[1] - this.last_local_mouse_position_[1]];
      for (let i = 0; i < this.mouseMoveEvents_.length; ++i)
        result = this.mouseMoveEvents_[i](p, delta, e) || result;
      this.did_drag_ = result;
      if (this.did_drag_) {
        this.canvas_.style.cursor = "move";
      }
    } else if (e.type.toLowerCase() == "click") {
      if (!this.ignore_clicks_) {
        for (let i = 0; i < this.clickEvents_.length; ++i)
        result = this.clickEvents_[i](p, e) || result;
      }
    } else if (e.type.toLowerCase() == "dblclick") {
      if (!this.ignore_clicks_) {
        for (let i = 0; i < this.doubleClickEvents_.length; ++i)
        result = this.doubleClickEvents_[i](p, e) || result;
      }
    }
    if (result)
      RunLoop.postTaskAndDraw();
    this.last_local_mouse_position_ = p;
  }

  ignoreClicks() {
    this.ignore_clicks_ = true;
    if (this.ignore_clicks_handle_)
      clearTimeout(this.ignore_clicks_handle_);
    this.ignore_clicks_handle_ = setTimeout(() => { this.ignore_clicks_ = false; }, 60);
  }


  // Editing functionality.
  // TODO(vmpstr): Need tests.
  startEdit(item) {
    item.is_editing = true;
    this.label_editor_ = new LabelEditor(this, item);
  }

  finishEdit() {
    if (this.label_editor_ && this.label_editor_.item) {
      this.label_editor_.commitEdit();
      this.label_editor_.item.is_editing = false;
    }
  }


  // Draw functionality.
  // TODO(vmpstr): Need tests.
  startDraw() {
    this.ctx_.save();
    this.clearCanvas();
    this.ctx_.translate(this.global_scroll_offset_[0], this.global_scroll_offset_[1]);
    this.ctx_.scale(this.zoom_, this.zoom_);
  }

  clearCanvas() {
    this.ctx_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  }

  endDraw() {
    this.ctx_.restore();
  }


  // Getters and setters.
  get zoom() {
    return this.zoom_;
  }

  set zoom(v) {
    this.zoom_ = v;
    this.onZoomChanged();
  }

  get scroll_offset() {
    return this.global_scroll_offset_;
  }

  get dragging() {
    return this.did_drag_;
  }

  get canvas() {
    return this.canvas_;
  }

  get ctx() {
    return this.ctx_;
  }

  
  // Helpers.
  globalToLocal(p) {
    return new Point(
      [(p[0] - this.client_offset_[0] - this.global_scroll_offset_[0]) / this.zoom_,
       (p[1] - this.client_offset_[1] - this.global_scroll_offset_[1]) / this.zoom_]);
  }

}
