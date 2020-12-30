module MapMsg exposing (Msg(..))

import DragControl
import EventDecodersData exposing (..)
import Node exposing (Id, Children, Node)
import ResizeControl
import Memento
import Tree
import InputControl
import NodeControl

type Msg
  = MsgNoop
  | MsgDrag DragControl.Msg
  | MsgResize ResizeControl.Msg
  | MsgMemento Memento.Msg
  | MsgInput InputControl.Msg
  | MsgNode NodeControl.Msg
  | MsgOnChildEdgeHeightChanged OnChildEdgeHeightChangedData