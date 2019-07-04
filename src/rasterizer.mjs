import { AppCanvas } from './app_canvas.mjs';
import { Theme } from './theme.mjs';
import { LayoutItem } from './layout_item.mjs';

export class Rasterizer {
  constructor(app_canvas) {
    this.app_canvas_ = app_canvas;
  }

  draw(tree) {
    // TODO(vmpstr): Need better invalidation, instead of redrawing everything.
    this.app_canvas_.ctx.clearRect(0, 0, this.app_canvas_.canvas.width, this.app_canvas_.canvas.height);

    this.drawRecursive(Object.values(tree));
  }

  drawRecursive(items, edge_start) {
    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      if (item.hide)
        continue;

      if (item.dragging) {
        this.app_canvas_.ctx.save();
        this.app_canvas_.ctx.globalAlpha = Theme.alphaForDrag;
      }

      const box_rasterizer = Theme.boxRasterizer(item);
      box_rasterizer(this.app_canvas_.ctx, item.position[0], item.position[1], item.size[0], item.size[1]);
      if (item.selection && item.selection != "none") {
        const stroke_style =
          item.selection == "candidate" ? Theme.selectionCandidateBorderColor
                                        : Theme.selectionBorderColor;
        const x = item.position[0] - Theme.selectionPad;
        const y = item.position[1] - Theme.selectionPad;
        const width = item.size[0] + 2 * Theme.selectionPad;
        const height = item.size[1] + 2 * Theme.selectionPad;
        box_rasterizer(this.app_canvas_.ctx, x, y, width, height, stroke_style, Theme.selectionStrokeWidth);
      }

      if (!item.is_editing) {
        this.app_canvas_.ctx.beginPath();
        this.app_canvas_.ctx.font = Theme.fontStyle(item);
        this.app_canvas_.ctx.fillStyle = Theme.fontColor(item);
        this.app_canvas_.ctx.textBaseline = "middle";
        this.app_canvas_.ctx.fillText(item.label, item.position[0] + item.label_offset[0], item.position[1] + item.label_offset[1]);
      }

      if (item.decorators)
        item.decorators.rasterize(this.app_canvas_.ctx);

      if (item.dragging)
        this.app_canvas_.ctx.restore();

      if (edge_start) {
        const edge_end = [item.position[0], item.position[1] + 0.5 * item.size[1]];
        const edge_rasterizer = Theme.edgeRasterizer(item);
        edge_rasterizer(this.app_canvas_.ctx, edge_start, edge_end);
        edge_start = Theme.edgeContinuation(item, edge_start, edge_end);
      }

      if (item.children.length > 0) {
        const child_edge_start = [0.5 * (item.position[0] + item.children[0].position[0]), item.position[1] + item.size[1]];
        this.drawRecursive(item.children, child_edge_start);
      }
    }
  }
}
