module Map exposing (main)

import Browser
import DragControl
import Html exposing (Html, div)
import Html.Attributes exposing (class, attribute, id)
import Html.Events exposing (custom)
import Json.Decode as Decoder exposing (Decoder)
import Json.Encode as Encode
import MapMsg exposing (..)
import MapView exposing (ViewState)
import Maybe.Extra
import Node exposing (Node, Children(..), childList, Id, NodeType(..))
import NodeUtils exposing (idToAttribute, nodesDecoder, encodeNodes)
import ResizeControl
import ScrollerLayout
import Tree
import TreeLayout
import TreeSpec
import UserAction
import Utils exposing (toMsgOrNoop)
import Memento
import MapModel exposing (Model, State)
import InputControl
import NodeControl
import Layout


initModel : Model
initModel =
  { nodes = Children []
  , state = 
      { action = UserAction.Idle
      , drag = Nothing
      , editing = Nothing
      , selected = Nothing
      }
  }

moduleUpdate
  : (msg -> (State, Children) -> (State, Children, Cmd msg))
  -> (msg -> Msg)
  -> msg
  -> Model
  -> (Model, Cmd Msg)
moduleUpdate updater wrapMsg moduleMsg model =
  let
    (state, nodes, cmd) = updater moduleMsg (model.state, model.nodes)
  in
  ({ model | state = state, nodes = nodes }, Cmd.map wrapMsg cmd)

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    -- Noop
    MsgNoop ->
      (model, Cmd.none)
    -- Module deferrals
    MsgDrag dragMsg ->
      moduleUpdate DragControl.update MsgDrag dragMsg model
    MsgResize resizeMsg ->
      moduleUpdate ResizeControl.update MsgResize resizeMsg model
    MsgMemento mementoMsg ->
      moduleUpdate Memento.update MsgMemento mementoMsg model
    MsgInput inputMsg ->
      moduleUpdate InputControl.update MsgInput inputMsg model
    MsgNode nodeMsg ->
      moduleUpdate NodeControl.update MsgNode nodeMsg model


-- Program setup.
init : () -> (Model, Cmd Msg)
init () = (initModel, Memento.loadLatestState ())

subscriptions : Model -> Sub Msg
subscriptions _ =
  [ Sub.map MsgDrag (DragControl.subscriptions ())
  , Sub.map MsgResize (ResizeControl.subscriptions ())
  , Sub.map MsgMemento (Memento.subscriptions ())
  , Sub.map MsgInput (InputControl.subscriptions ())
  , Sub.map MsgNode (NodeControl.subscriptions ())
  ] |> Sub.batch

main : Program () Model Msg
main =
    Browser.element
      { init = init
      , view = Layout.view
      , update = Memento.intercept update
      , subscriptions = subscriptions
      }
