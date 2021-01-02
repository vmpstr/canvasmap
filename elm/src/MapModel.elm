module MapModel exposing (..)

import DragControl
import UserAction
import Node exposing (Id, Children(..))
import ViewStack

type alias Model =
  { nodes : Children
  , state : State
  }

-- action should just include the state
type alias State =
  { action : UserAction.Action
  , drag : Maybe DragControl.State
  , editing : Maybe Id
  , selected : Maybe Id
  , annotation : Maybe Id
  , viewStack : List (ViewStack.Type)
  }
