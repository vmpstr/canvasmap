module MMMode exposing (Mode(..), canPreempt)

type Mode
  = Idle
  | Dragging
  | Editing


canPreempt : Mode -> Mode -> Bool
canPreempt new old =
  case (new, old) of
    (_, Idle) -> True
    (Idle, _) -> False
    (Dragging, Dragging) -> True
    (Editing, Editing) -> True
    (Dragging, Editing) -> True
    (Editing, Dragging) -> False

