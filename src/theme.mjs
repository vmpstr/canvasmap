export class Theme {
  static fontFace(item) {
    return (item && item.font && item.font.face) || Theme.defaults(item).font.face;
  }

  static fontSize(item) {
    return (item && item.font && item.font.size) || Theme.defaults(item).font.size;
  }

  static fontColor(item) {
    if (item && item.font && item.font.color !== undefined)
      return item.font.color;
    return Theme.defaults(item).font.color;
  }

  static fontStyle(item) {
    return Theme.fontSize(item) + "px " + Theme.fontFace(item);
  }

  static borderColor(item) {
    if (item && item.border && item.border.color !== undefined)
      return item.border.color;
    return Theme.defaults(item).border.color;
  }

  static borderWidth(item) {
    if (item && item.border && item.border.width !== undefined)
      return item.border.width;
    return Theme.defaults(item).border.width;
  }

  static padding(item) {
    if (item && item.padding !== undefined)
      return item.padding;
    return Theme.defaults(item).padding;
  }

  static fillStyle(item) {
    if (item && item.box && item.box.color !== undefined)
      return item.box.color;
    return Theme.defaults(item).box.color;
  }

  static get alphaForDrag() {
    return Theme.defaultAlphaForDrag;
  }

  static boxRasterizer(item) {
    return Theme.defaults(item).boxRasterizer(item);
  }

  static edgeRasterizer(item) {
    return Theme.defaults(item).edgeRasterizer(item);
  }

  static edgeContinuation(item, edge_start, edge_end) {
    return Theme.defaults(item).edgeContinuation(item, edge_start, edge_end);
  }

  static defaults(item) {
    return item && (item.parent || item.tentative_parent) ? Theme.childDefaults : Theme.rootDefaults;
  }

  static childSpacing(item) {
    if (item && item.child_spacing !== undefined)
      return item.child_spacing;
    return Theme.defaults(item).childSpacing;
  }

  static childIndent(item) {
    if (item && item.child_indent !== undefined)
      return item.child_indent;
    return Theme.defaults(item).childIndent;
  }

  static borderRadius(item) {
    if (item && item.border && item.border.radius !== undefined)
      return item.border.radius;
    return Theme.defaults(item).border.radius;
  }

  static edgeRadius(item) {
    if (item && item.edge && item.edge.radius !== undefined)
      return item.edge.radius;
    return Theme.defaults(item).edge.radius;
  }

  static edgeColor(item) {
    if (item && item.edge && item.edge.color !== undefined)
      return item.edge.color;
    return Theme.defaults(item).edge.color;
  }

  static edgeWidth(item) {
    if (item && item.edge && item.edge.width !== undefined)
      return item.edge.width;
    return Theme.defaults(item).edge.width;
  }

  static minWidth(item) {
    const radius = Theme.borderRadius(item);
    return Math.max(radius * 2, 0.5 * Theme.childIndent(item) + radius + 1);
  }

  static minHeight(item) {
    return Theme.borderRadius(item) * 2;
  }
}

Theme.defaultAlphaForDrag = 0.5;

Theme.rootDefaults = {
  font: {
    size: 20,
    face: "sans-serif",
    color: "black"
  },
  border: {
    width: 2,
    color: "black",
    radius: 5
  },
  box: {
    color: "transparent"
  },
  padding: 10,
  childSpacing: 10,
  childIndent: 50
};
Theme.rootDefaults.boxRasterizer = (item) => {
  return (ctx, x, y, width, height) => {
    ctx.beginPath();
    console.assert(width >= Theme.minWidth(item));
    console.assert(height >= Theme.minHeight(item));
    const radius = Theme.borderRadius(item);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);

    ctx.fillStyle = Theme.fillStyle(item);
    ctx.fill();

    ctx.strokeStyle = Theme.borderColor(item);
    ctx.lineWidth = Theme.borderWidth(item);
    ctx.stroke();
  };
};

Theme.childDefaults = {
  font: {
    size: 15,
    face: "serif",
    color: "blue"
  },
  border: {
    width: 1,
    color: "black",
    radius: 10
  },
  box: {
    color: "transparent"
  },
  padding: 5,
  childSpacing: 5,
  childIndent: 30,
  edge: {
    radius: 7,
    color: "black",
    width: 1
  }
};
Theme.childDefaults.boxRasterizer = (item) => {
  return (ctx, x, y, width, height) => {
    ctx.beginPath();
    const radius = Theme.borderRadius(item);
    console.assert(width >= Theme.minWidth(item));
    console.assert(height >= Theme.minHeight(item));
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);

    ctx.fillStyle = Theme.fillStyle(item);
    ctx.fill();

    ctx.strokeStyle = Theme.borderColor(item);
    ctx.lineWidth = Theme.borderWidth(item);
    ctx.stroke();
  };
};
Theme.childDefaults.edgeRasterizer = (item) => {
  return (ctx, edge_start, edge_end) => {
    ctx.beginPath();
    ctx.moveTo(edge_start[0], edge_start[1]);
    const radius = Theme.edgeRadius(item);
    ctx.lineTo(edge_start[0], edge_end[1] - radius);
    ctx.arcTo(edge_start[0], edge_end[1], edge_start[0] + radius, edge_end[1], radius);
    ctx.lineTo(edge_end[0], edge_end[1]);
    ctx.strokeStyle = Theme.edgeColor(item);
    ctx.lineWidth = Theme.edgeWidth(item);
    ctx.stroke();
  };
};
Theme.childDefaults.edgeContinuation = (item, edge_start, edge_end) => {
  return [edge_start[0], edge_end[1] - Theme.edgeRadius(item)];
}

Theme.placeholderStyle = {
  box: {
    color: "rgba(128, 128, 128, 0.4)"
  },
  border: {
    color: "transparent"
  },
  edge: {
    color: "rgb(128, 128, 128)"
  }
};
