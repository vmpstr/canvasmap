module MapMsg exposing (Msg(..))

import Node exposing (Id, Children, Node)
import DragControl
import ResizeControl
import Tree
import EventDecodersData exposing (..)

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