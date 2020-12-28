port module Map exposing (main)

import Browser
import Html exposing (Html, div, text, label)
import Html.Attributes exposing (class, classList, style, attribute, id)
import Html.Events exposing (custom, on, onDoubleClick)
import Json.Decode as Decoder exposing (Decoder, succeed, string, float, field, bool, fail, nullable)
import Json.Decode.Pipeline exposing (required, hardcoded, optional)
import Json.Encode as Encode
import Maybe.Extra

import DragControl
import Node exposing (Node, Children(..), childList, Id, NodeType(..))
import NodeUtils exposing (idToAttribute, idToShadowAttribute, nodesDecoder, encodeNodes)
import UserAction
import TreeSpec
import MapView exposing (ViewState)
import Geometry
import Utils exposing (toMsgOrNoop, asPx)
import Tree
import TreeLayout
import ScrollerLayout
import MapMsg exposing (..)
import EventDecodersData exposing (..)
import ResizeControl

-- Probably work to remove this
import EventDecoders exposing (..)

{- TODOs
 - I think it's overkill to have Vector and not array
 - Refactor a whole lot of this into separate decoders module
 - Test everything
 - maybe write some comments or documentation
 - the beacon finding anchor should depend on where the drag is moving:
    moving down: maybe bot left corner, moving up: maybe top left corner
 - selection gets removed after drag is finished
 -}

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
  }

-- Functionality
port portEditLabel : { targetId : String } -> Cmd msg
port portSaveState : Encode.Value -> Cmd msg
port portNodeSelected : { targetId : String } -> Cmd msg
port portLoadState : () -> Cmd msg

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
    , custom "dblclick" (onAddNewNodeClickDecoder model.nodes)
    , custom "click" (onSelectClickDecoder Nothing)
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


applyChildEdgeHeightChange : Children -> OnChildEdgeHeightChangedData -> Children
applyChildEdgeHeightChange (Children nodes) { targetId, height } =
  let updater node = { node | childEdgeHeight = height } in
  case TreeSpec.findNode nodes targetId of
    Just path ->
      Children (TreeSpec.updateNode nodes path updater)
    Nothing ->
      Children nodes

updateAndSave : Msg -> Model -> (Model, Cmd Msg)
updateAndSave msg model =
  let
    (newModel, cmd) = update msg model
    isDelete =
      case msg of
        MsgDeleteNode _ -> True
        _ -> False

    saveCmd =
      -- The reason we save isDelete is that there is no action change
      -- when this happens. Create, for example, comes with an automatic
      -- label edit which causes a state change.
      -- TODO: Make this more elegant somehow (remove not isdelete?)
      if (not isDelete) && model.state.action == newModel.state.action then
        Cmd.none
      else
        encodeNodes newModel.nodes |> portSaveState
  in
  (newModel, [cmd, saveCmd] |> Cmd.batch)


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

    -- TODO: Maybe fold this into resize control?
    MsgOnChildEdgeHeightChanged data ->
      ({ model | nodes = applyChildEdgeHeightChange model.nodes data }, Cmd.none)

    -- Edit control
    MsgEditLabel nodeId ->
      let
          state = applyEditLabelState model.state nodeId
      in
      ({ model | state = state }, portEditLabel { targetId = idToAttribute nodeId })

    MsgOnLabelChanged data ->
      let
          nodes = applyLabelChange model.nodes data.targetId data.label
          state = endEditLabelState model.state
      in
      ({ model | nodes = nodes, state = state }, Cmd.none)

    -- TODO: have a loading state so that we don't do anything before this.
    -- Load control
    MsgSetNodes children ->
      ({ model | nodes = children }, Cmd.none)

    -- Node genesis
    MsgNewNode path node ->
      let 
        (state, cmd) = selectNode model.state (Just node.id)
        (newModel, editCmd) =
          update
            (MsgEditLabel node.id)
            { model
              | nodes = insertChild model.nodes path node
              , state = state
            }
      in
      (newModel, [ cmd, editCmd ] |> Cmd.batch)

    MsgSelectNode id ->
      let
        (state, cmd) = selectNode model.state id
      in
      ({ model | state = state }, cmd)

    MsgDeleteNode id ->
      let
        (state, cmd) =
          if model.state.selected == Just id then
            selectNode model.state Nothing
          else
            (model.state, Cmd.none)
      in
      ({ model | nodes = removeChild model.nodes id, state = state }, cmd)

    -- TODO: modularize input control
    MsgMapKeyDown key ->
      handleMapKeyDown key.code model


handleMapKeyDown : String -> Model -> (Model, Cmd Msg)
handleMapKeyDown key model =
  if key == "Backspace" || key == "Delete" then
    case model.state.selected of
       Just id ->
        -- We need to use updateAndSave here so that we intercept MsgDeleteNode
        -- and save state.
        updateAndSave (MsgDeleteNode id) model
       Nothing ->
        update MsgNoop model
  -- TODO: support Editing as well, but need to stop editing
  -- This seems to work already. How?
  else if key == "Tab" && model.state.action == UserAction.Idle then
    case model.state.selected
          |> Maybe.andThen (pathToFirstChildOfId model.nodes) of
      Just path ->
        update (MsgNewNode path (NodeUtils.newNode model.nodes)) model
      Nothing ->
        update MsgNoop model
  else if key == "Enter" && model.state.action == UserAction.Idle then
    case model.state.selected
          |> Maybe.andThen (pathToNextSiblingOfId model.nodes) of
      Just path ->
        update (MsgNewNode path (NodeUtils.newNode model.nodes)) model
      Nothing ->
        update MsgNoop model
  else
    update MsgNoop model

pathToNextSiblingOfId : Children -> Id -> Maybe Tree.Path
pathToNextSiblingOfId (Children nodes) id =
  case TreeSpec.findNode nodes id of
    Just path ->
      -- Next sibling of top level item is its first child
      case path of
        Tree.AtIndex index -> pathToFirstChildOfId (Children nodes) id
        _ -> Just (Tree.incrementBase path)
    Nothing ->
      Nothing

pathToFirstChildOfId : Children -> Id -> Maybe Tree.Path
pathToFirstChildOfId (Children nodes) id =
  case TreeSpec.findNode nodes id of
    Just path ->
      Just (Tree.appendPath 0 (Just path))
    Nothing ->
      Nothing

selectNode : State -> Maybe Id -> (State, Cmd Msg)
selectNode state id =
  let
    cmd =
      if state.selected /= id then
        case id of 
          Just value -> portNodeSelected { targetId = idToAttribute value }
          Nothing -> Cmd.none
      else
        Cmd.none
  in
  ({ state | selected = id }, cmd)

insertChild : Children -> Tree.Path -> Node -> Children
insertChild (Children nodes) path node =
  Children (TreeSpec.addNode nodes path node)

removeChild : Children -> Id -> Children
removeChild (Children nodes) id =
  let
    mpath = TreeSpec.findNode nodes id
  in
  case mpath of
    Just path ->
      Children (TreeSpec.removeNode nodes path)
    Nothing ->
      Children nodes


applyLabelChange : Children -> Id -> String -> Children
applyLabelChange (Children nodes) targetId label =
  let updater node = { node | label = label } in
  case TreeSpec.findNode nodes targetId of
    Just path ->
      Children (TreeSpec.updateNode nodes path updater)
    Nothing ->
      Children nodes

endEditLabelState : State -> State
endEditLabelState state =
  { state | action = UserAction.Idle, drag = Nothing, editing = Nothing }

applyEditLabelState : State -> Id -> State
applyEditLabelState state id =
  { state | action = UserAction.Editing, drag = Nothing, editing = Just id }

port portOnLoadState : (Decoder.Value -> msg) -> Sub msg

onLoadStateSubscription : Sub Msg
onLoadStateSubscription =
  portOnLoadState
    (Decoder.decodeValue nodesDecoder >> toMsgOrNoop MsgSetNodes MsgNoop)

port portOnKeyDown : (Decoder.Value -> msg) -> Sub msg

onKeyDownSubscription : Sub Msg
onKeyDownSubscription =
  portOnKeyDown
    (Decoder.decodeValue keyDecoder >> toMsgOrNoop MsgMapKeyDown MsgNoop)

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
init () = (initModel, portLoadState ())

subscriptions : Model -> Sub Msg
subscriptions _ =
  [ Sub.map MsgDrag (DragControl.subscriptions ())
  , Sub.map MsgResize (ResizeControl.subscriptions ())
  , onLoadStateSubscription
  , onKeyDownSubscription
  ] |> Sub.batch

main : Program () Model Msg
main =
    Browser.element
      { init = init
      , view = view
      , update = updateAndSave
      , subscriptions = subscriptions
      }
