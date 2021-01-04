module AnnotationControl exposing (..)

import EventUtils exposing (Key)
import Node exposing (Children, NodeId)
import UserAction
import ViewStack
import Html exposing (Attribute)
import Html.Events exposing (custom)
import MsgUtils
import Json.Decode as Decoder exposing (Decoder, succeed)

type Msg
  = MsgNoop
  | MsgEndAnnotations

type alias State =
  { nodeId : NodeId
  }

type alias AppState a =
  { a
    | action : UserAction.Action
    , annotation : Maybe State
    , viewStack : List (ViewStack.Type)
    , selected : Maybe NodeId
  }

endAnnotationsAttribute : Attribute Msg
endAnnotationsAttribute =
  custom "click" onEndAnnotationsClickDecoder

getStateForNode : Children -> NodeId -> State
getStateForNode children id =
  { nodeId = id }

setStateForNode : Children -> State -> Children
setStateForNode children state =
  children

startAnnotations : NodeId -> AppState a -> Children -> (AppState a, Children, Cmd Msg)
startAnnotations id state children =
  let
    newState =
      { state
        | action = UserAction.Annotating
        , annotation = Just (getStateForNode children id)
        , viewStack = ViewStack.Annotation :: state.viewStack
      }
  in
  (newState, children, Cmd.none)

endAnnotations : AppState a -> Children -> (AppState a, Children, Cmd Msg)
endAnnotations state children =
  let
    newViewStack =
      case state.viewStack of
        ViewStack.Annotation :: rest -> rest
        other -> other

    newChildren =
      case state.annotation of
        Just annotation -> setStateForNode children annotation
        Nothing -> children

    newState =
      { state
        | action = UserAction.Idle
        , annotation = Nothing
        , viewStack = newViewStack
      }
  in
  (newState, newChildren, Cmd.none)

handlesKey : Key -> AppState a -> Bool
handlesKey key state =
  key.code == "KeyK" && state.action == UserAction.Idle

handleKey : Key -> AppState a -> Children -> (AppState a, Children, Cmd Msg)
handleKey key state children =
  if key.code == "KeyK" && state.action == UserAction.Idle then
    case state.selected of
      Just id -> startAnnotations id state children
      Nothing -> (state, children, Cmd.none)
  else
    (state, children, Cmd.none)

update : Msg -> (AppState a, Children) -> (AppState a, Children, Cmd Msg)
update msg (state, children) =
  case msg of
    MsgNoop -> (state, children, Cmd.none)
    MsgEndAnnotations -> endAnnotations state children

onEndAnnotationsClickDecoder : Decoder (MsgUtils.MsgWithEventOptions Msg)
onEndAnnotationsClickDecoder =
  Decoder.map MsgUtils.andStopPropagation (succeed MsgEndAnnotations)