module AnnotationControl exposing (..)

import MapModel exposing (State)
import EventUtils exposing (Key)
import Node exposing (Children, Id)
import UserAction
import ViewStack

type Msg
  = MsgNoop

startAnnotations : Id -> State -> Children -> (State, Children, Cmd Msg)
startAnnotations id state children =
  let
    newState =
      { state
        | action = UserAction.Annotating
        , annotation = Just id
        , viewStack = ViewStack.Annotation :: state.viewStack
      }
  in
  (newState, children, Cmd.none)

endAnnotations : State -> Children -> (State, Children, Cmd Msg)
endAnnotations state children =
  let
    newViewStack =
      case state.viewStack of
        ViewStack.Annotation :: rest -> rest
        other -> other
    newState =
      { state
        | action = UserAction.Idle
        , annotation = Nothing
        , viewStack = newViewStack
      }
  in
  (newState, children, Cmd.none)

handlesKey : Key -> State -> Bool
handlesKey key state =
  key.code == "KeyK" && state.action == UserAction.Idle

handleKey : Key -> State -> Children -> (State, Children, Cmd Msg)
handleKey key state children =
  if key.code == "KeyK" && state.action == UserAction.Idle then
    case state.selected of
      Just id -> startAnnotations id state children
      Nothing -> (state, children, Cmd.none)
  else
    (state, children, Cmd.none)

update : Msg -> (State, Children) -> (State, Children, Cmd Msg)
update msg (state, children) =
  (state, children, Cmd.none)