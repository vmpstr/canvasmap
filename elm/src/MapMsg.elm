module MapMsg exposing (Msg(..))

import DragControl
import ResizeControl
import Memento
import Tree
import InputControl
import NodeControl
import AnnotationControl

type Msg
  = MsgNoop
  | MsgDrag DragControl.Msg
  | MsgResize ResizeControl.Msg
  | MsgMemento Memento.Msg
  | MsgInput InputControl.Msg
  | MsgNode NodeControl.Msg
  | MsgAnnotation AnnotationControl.Msg