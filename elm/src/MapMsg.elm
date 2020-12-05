module MapMsg exposing (Msg(..), MsgWithEventOptions)

import Node exposing (Id, Children, Node)
import DragControl
import Tree
import EventDecodersData exposing (..)

type Msg
  = MsgDrag DragControl.Msg
  | MsgNoop
  | MsgOnPointerDown OnPointerDownPortData
  | MsgOnChildEdgeHeightChanged OnChildEdgeHeightChangedData
  | MsgOnLabelChanged OnLabelChangedData
  | MsgEditLabel Id
  | MsgSetNodes Children
  | MsgNewNode Tree.Path Node
  | MsgSelectNode (Maybe Id)
  | MsgDeleteNode Id
  | MsgMapKeyDown Key

type alias MsgWithEventOptions =
  { message: Msg
  , stopPropagation: Bool
  , preventDefault: Bool
  }
