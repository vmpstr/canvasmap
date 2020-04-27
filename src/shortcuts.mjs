export async function initialize(version) {}

export const action = {
  kNoAction: "nope",
  kUndo: "undo",
  kRedo: "redo",
  kLabelEdit: "label_edit",
  kDelete: "delete",
  kEditUrl: "edit_url",
};

export function eventToAction(e) {
  if (e.key == "e")
    return action.kLabelEdit;

  if (e.key == "Delete" || e.key == "Backspace")
    return action.kDelete;

  // TODO(vmpstr): Figure out mac undo/redo
  if (e.key == 'z' && e.ctrlKey)
    return action.kUndo;
  if (e.key == 'y' && e.ctrlKey)
    return action.kRedo;

  if (e.key == 'k' && e.ctrlKey)
    return action.kEditUrl;

  return action.kNoAction;
}
