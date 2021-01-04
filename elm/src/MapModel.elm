module MapModel exposing (..)

import DragControl
import UserAction
import Node exposing (NodeId, Children(..))
import ViewStack
import AnnotationControl

type alias Model =
  { nodes : Children
  , state : State
  }

-- action should just include the state
type alias State =
  { action : UserAction.Action
  , drag : Maybe DragControl.State
  , editing : Maybe NodeId
  , selected : Maybe NodeId
  , annotation : Maybe AnnotationControl.State
  , viewStack : List (ViewStack.Type)
  }
