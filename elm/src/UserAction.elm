module UserAction exposing (Action(..), canPreempt)

type Action
  = Idle
  | Dragging
  | Editing
  | Resizing

canPreempt : Action -> Action -> Bool
canPreempt new old =
  case (new, old) of
    (_, Idle) -> True
    (Idle, _) -> False
    (Dragging, Dragging) -> True
    (Editing, Editing) -> True
    (Dragging, Editing) -> False
    (Editing, Dragging) -> False
    (Resizing, _) -> False
    (_, Resizing) -> True

