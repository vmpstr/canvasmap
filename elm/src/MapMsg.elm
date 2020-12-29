module MapMsg exposing (Msg(..))

import DragControl
import EventDecodersData exposing (..)
import Node exposing (Id, Children, Node)
import ResizeControl
import Tree

type Msg
  = MsgNoop
  | MsgDrag DragControl.Msg
  | MsgResize ResizeControl.Msg
  | MsgOnChildEdgeHeightChanged OnChildEdgeHeightChangedData
  | MsgOnLabelChanged OnLabelChangedData
  | MsgEditLabel Id
  | MsgSetNodes Children
  | MsgNewNode Tree.Path Node
  | MsgSelectNode (Maybe Id)
  | MsgDeleteNode Id
  | MsgMapKeyDown Key