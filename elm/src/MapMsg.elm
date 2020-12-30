module MapMsg exposing (Msg(..))

import DragControl
import EventDecodersData exposing (..)
import Node exposing (Id, Children, Node)
import ResizeControl
import Memento
import Tree

type Msg
  = MsgNoop
  | MsgDrag DragControl.Msg
  | MsgResize ResizeControl.Msg
  | MsgMemento Memento.Msg
  | MsgOnChildEdgeHeightChanged OnChildEdgeHeightChangedData
  | MsgOnLabelChanged OnLabelChangedData
  | MsgEditLabel Id
  | MsgNewNode Tree.Path Node
  | MsgSelectNode (Maybe Id)
  | MsgDeleteNode Id
  | MsgMapKeyDown Key