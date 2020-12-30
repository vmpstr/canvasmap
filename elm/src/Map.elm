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


-- Probably work to remove this

{- TODOs
 - I think it's overkill to have Vector and not array
 - Refactor a whole lot of this into separate decoders module
 - Test everything
 - maybe write some comments or documentation
 - the beacon finding anchor should depend on where the drag is moving:
    moving down: maybe bot left corner, moving up: maybe top left corner
 - selection gets removed after drag is finished
 -}

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

view : Model -> Html Msg
view model =
  let
      nodes = childList model.nodes
      viewState = getInitialViewState model.state
      childrenViewList = List.indexedMap (viewTopNode viewState) nodes
      dragViewList =
        List.map viewDragNode
          (DragControl.getDragNode model.state nodes
            |> Maybe.Extra.toList)
  in
  div
    [ class "map"
    , NodeControl.onAddNewNodeAttribute MsgNode model.nodes
    , NodeControl.onDeselectAttribute MsgNode
    ]
    (childrenViewList ++ dragViewList)

viewDragNode : Node -> Html Msg
viewDragNode node =
  viewTopNode DragControl.dragNodeViewState -1 node

viewTopNode : ViewState -> Int -> Node -> Html Msg
viewTopNode parentState index node =
  let
    localState : ViewState
    localState = getViewStateForNode index node parentState

    onTop = index < 0
    tailBeacons =
      Utils.maybeArray
        localState.viewBeacons
        (\() -> viewBeacon localState.tailBeaconPath)
    childState =
      case node.nodeType of
        NodeTypeTree -> TreeLayout.adjustStateForChildren localState
        NodeTypeScroller -> ScrollerLayout.adjustStateForChildren localState
    childNodes =
      childList node.children
        |> List.indexedMap (viewChildNode childState)
        |> List.concat
  in
  case node.nodeType of
    NodeTypeTree -> TreeLayout.viewTopNode onTop tailBeacons childNodes localState node
    NodeTypeScroller -> ScrollerLayout.viewTopNode onTop tailBeacons childNodes localState node

viewChildNode : ViewState -> Int -> Node -> List (Html Msg)
viewChildNode parentState index node =
  let
    localState = getViewStateForNode index node parentState
    headBeacons =
      Utils.maybeArray
        parentState.viewBeacons
        (\() -> viewBeacon localState.headBeaconPath)
    tailBeacons =
      Utils.maybeArray
        localState.viewBeacons
        (\() -> viewBeacon localState.tailBeaconPath)
    childState =
      case node.nodeType of
        NodeTypeTree -> TreeLayout.adjustStateForChildren localState
        NodeTypeScroller -> ScrollerLayout.adjustStateForChildren localState
    childNodes =
       childList node.children
         |> List.indexedMap (viewChildNode childState)
         |> List.concat
  in
  case node.nodeType of
    NodeTypeTree -> TreeLayout.viewChildNodes headBeacons tailBeacons childNodes localState node
    NodeTypeScroller -> ScrollerLayout.viewChildNodes headBeacons tailBeacons childNodes localState node

viewBeacon : String -> Html Msg
viewBeacon path =
  div [ class "beacon"
      , attribute "path" path
      ] []

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    -- Noop
    MsgNoop ->
      (model, Cmd.none)

    -- Module deferrals
    MsgDrag dragMsg ->
      let
          (state, nodes, cmd) = DragControl.update dragMsg (model.state, model.nodes)
      in
      ({ model | state = state, nodes = nodes }, Cmd.map MsgDrag cmd)

    MsgResize resizeMsg ->
      let
          (state, nodes, cmd) = ResizeControl.update resizeMsg (model.state, model.nodes)
      in
      ({ model | state = state, nodes = nodes }, Cmd.map MsgResize cmd)

    MsgMemento mementoMsg ->
      let
          (state, nodes, cmd) = Memento.update mementoMsg (model.state, model.nodes)
      in
      ({ model | state = state, nodes = nodes }, Cmd.map MsgMemento cmd)

    MsgInput inputMsg ->
      let
          (state, nodes, cmd) = InputControl.update inputMsg (model.state, model.nodes)
      in
      ({ model | state = state, nodes = nodes }, Cmd.map MsgInput cmd)

    MsgNode nodeMsg ->
      let
          (state, nodes, cmd) = NodeControl.update nodeMsg (model.state, model.nodes)
      in
      ({ model | state = state, nodes = nodes }, Cmd.map MsgNode cmd)


initialViewStateAdjusters : State -> List (ViewState -> ViewState)
initialViewStateAdjusters state =
  [ DragControl.adjustInitialViewState state
  , adjustInitialViewState state
  ]

viewStateAdjustersForNode : Int -> Node -> List (ViewState -> ViewState)
viewStateAdjustersForNode index node =
  [ DragControl.adjustViewStateForNode index node
  , adjustViewStateForNode index node
  ]

getInitialViewState : State -> ViewState
getInitialViewState state =
  Utils.listApply
    MapView.defaultViewState
    (initialViewStateAdjusters state)

getViewStateForNode : Int -> Node -> ViewState -> ViewState
getViewStateForNode index node viewState =
  Utils.listApply
    viewState
    (viewStateAdjustersForNode index node)

adjustInitialViewState : State -> ViewState -> ViewState
adjustInitialViewState state viewState =
  { viewState
    | editId = state.editing
    , selected = state.selected
  }

adjustViewStateForNode : Int -> Node -> ViewState -> ViewState
adjustViewStateForNode _ _ viewState = viewState

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
      , view = view
      , update = Memento.intercept update
      , subscriptions = subscriptions
      }
