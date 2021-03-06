port module DragControl exposing
  ( Msg
  , State
  , update
  , subscriptions
  , getDragNode
  , adjustInitialViewState
  , adjustViewStateForNode
  , dragNodeViewState
  , onDragAttribute
  )

import EventUtils exposing (OnPointerDownPortData)
import Geometry exposing (Vector, Rect, vectorDecoder, rectDecoder)
import Html exposing (Attribute)
import Html.Events exposing (custom)
import Json.Decode as Decoder exposing (Decoder, succeed, float, list, string)
import Json.Decode.Pipeline exposing (required, optional, hardcoded)
import MapView exposing (ViewState)
import MsgUtils
import Node exposing (Children(..), Node, NodeId, childList)
import NodeUtils exposing (idAttributeDecoder, idToShadowAttribute, idToAttribute)
import Tree exposing (Path(..), pathDecoder, isSubpath)
import TreeSpec
import UserAction
import Utils exposing (maybeJust, maybeCmd, toMsgOrNoop)



{- TODOs
 - Maybe beacons should have Path but really should just reference ids
   "before X", "childOf X", etc which means this module doesn't have to
   depend on Tree
 -}

-- Exposed
type Msg
  = MsgNoop
  | MsgOnDragPointerDown OnPointerDownPortData
  | MsgOnDragStart OnDragData
  | MsgOnDragBy OnDragData
  | MsgOnDragStop

type alias State =
  { dragId : NodeId
  }

update : Msg -> (AppState a, Children) -> (AppState a, Children, Cmd Msg)
update msg (appState, nodes) =
  case msg of
    MsgNoop ->
      (appState, nodes, Cmd.none)
    MsgOnDragStart data ->
      applyDragStartData appState nodes data
    MsgOnDragBy data ->
      applyDragByData appState nodes data
    MsgOnDragStop ->
      applyDragStop appState nodes
    MsgOnDragPointerDown data ->
      (appState, nodes, portOnDragPointerDown data)

subscriptions: () -> Sub Msg
subscriptions () =
  [ onDragStartSubscription
  , onDragBySubscription
  , onDragStopSubscription
  ] |> Sub.batch

getDragNode : AppState a -> List Node -> Maybe Node
getDragNode { drag } nodes =
  drag |> Maybe.andThen
    (\state -> TreeSpec.nodeAtById nodes state.dragId)

dragNodeViewState : ViewState
dragNodeViewState = MapView.defaultViewState

adjustInitialViewState : AppState a -> ViewState -> ViewState
adjustInitialViewState { action, drag } view =
  let
    viewBeacons = action == UserAction.Dragging
    dragId = Maybe.map .dragId drag
  in
  { view
    | viewBeacons = viewBeacons
    , dragId = dragId
  }

adjustViewStateForNode : Int -> Node -> ViewState -> ViewState
adjustViewStateForNode index node state =
  let
    viewBeacons = state.viewBeacons && state.dragId /= Just node.id
    headBeaconPath = String.trimLeft (state.headBeaconPath ++ " " ++ String.fromInt index)
    tailBeaconPath = headBeaconPath ++ " " ++ String.fromInt (List.length (childList node.children))
    shadow = state.dragId == Just node.id
    htmlNodeId =
      if shadow then
        idToShadowAttribute node.id
      else
        idToAttribute node.id
  in
  { state
  | viewBeacons = viewBeacons
  , headBeaconPath = headBeaconPath
  , tailBeaconPath = tailBeaconPath
  , shadow = shadow
  , htmlNodeId = htmlNodeId
  }

-- Internal
type alias AppState a =
  { a
  | action : UserAction.Action
  , drag : Maybe State
  }

type alias OnDragData =
  { targetId : NodeId
  , dx : Float
  , dy : Float
  , geometry : Geometry
  }

type alias Geometry =
  { target : Rect
  , beacons : List Beacon
  }

type alias Beacon =
  { path : Path
  , location : Vector
  }

-- Ports
port portOnDragStart : (Decoder.Value -> msg) -> Sub msg
port portOnDragBy : (Decoder.Value -> msg) -> Sub msg
port portOnDragStop : (Decoder.Value -> msg) -> Sub msg
port portRafAlign : () -> Cmd msg
port portOnDragPointerDown : OnPointerDownPortData -> Cmd msg

type TargetBias
  = BiasMid
  | BiasUp
  | BiasDown

findClosestBeaconPath : Path -> Geometry -> TargetBias -> Maybe Path
findClosestBeaconPath ignorePath geometry bias =
  let
    validPath path =
      not (isSubpath path ignorePath)

    validPosition beacon =
      let
          slack =
            case beacon.path of
              InSubtree _ (AtIndex _) -> geometry.target.size.x
              _ -> 10
      in
      beacon.location.x <= geometry.target.position.x + slack &&
      beacon.location.x >= geometry.target.position.x - geometry.target.size.x &&
      beacon.location.y <= geometry.target.position.y + geometry.target.size.y + 50 &&
      beacon.location.y >= geometry.target.position.y - 50

    filteredBeacons =
      List.filter
        (\beacon -> validPath beacon.path && validPosition beacon)
        geometry.beacons

    ratio =
      case bias of
        BiasMid -> 0.5
        BiasUp -> 0.2
        BiasDown -> 0.8

    tx = geometry.target.position.x
    ty = geometry.target.position.y + ratio * geometry.target.size.y

    computeDistance beacon =
      let (bx, by) = (beacon.location.x, beacon.location.y) in
      sqrt ((bx - tx) * (bx - tx) + (by - ty) * (by - ty))

    toDistanceBeacon beacon =
      { distance = computeDistance beacon
      , path = beacon.path
      }

    distanceBeacons = List.map toDistanceBeacon filteredBeacons

    sorted = List.sortBy .distance distanceBeacons

    pathIfClose distanceBeacon =
      maybeJust (distanceBeacon.distance <= 200) distanceBeacon.path
  in
  List.head sorted |> Maybe.andThen pathIfClose

getBeaconBias : Float -> TargetBias
getBeaconBias dy =
  if dy < 0 then
    BiasUp
  else if dy > 0 then
    BiasDown
  else
    BiasMid

updateNodePosition : List Node -> Path -> (Float, Float) -> List Node
updateNodePosition nodes path (dx, dy) =
  let
      addDelta node =
        let
            position =
              Vector (node.position.x + dx) (node.position.y + dy)
        in
        { node | position = position }
  in
  TreeSpec.updateNode nodes path addDelta

stopDrag : AppState a -> AppState a
stopDrag appState =
  { appState | action = UserAction.Idle, drag = Nothing }

setNodePosition : List Node -> NodeId -> Vector -> (Bool, List Node)
setNodePosition nodes id position =
  case TreeSpec.findNode nodes id of
    Just path ->
      let updater node = { node | position = position } in
      (True, TreeSpec.updateNode nodes path updater)
    Nothing ->
      (False, nodes)

applyDragStartData : AppState a -> Children -> OnDragData -> (AppState a, Children, Cmd Msg)
applyDragStartData
      ({ action } as appState)
      ((Children nodes) as children)
      { targetId, geometry } =
  if not (UserAction.canPreempt UserAction.Dragging action) then
    (appState, children, Cmd.none)
  else
    let
      (success, newNodes) = setNodePosition nodes targetId geometry.target.position
      newAction = if success then UserAction.Dragging else action
      newDrag = maybeJust success { dragId = targetId }
    in
    ({ appState | action = newAction, drag = newDrag }, Children newNodes, Cmd.none)


applyDragByData : AppState a -> Children -> OnDragData -> (AppState a, Children, Cmd Msg)
applyDragByData
      ({ action, drag } as appState)
      ((Children nodes) as children)
      { targetId, dx, dy, geometry } =
  if action /= UserAction.Dragging then
    (appState, children, Cmd.none)
  else
    let
        stateIfMatchesTarget state =
          maybeJust (state.dragId == targetId) state 

        findTargetPath state =
          TreeSpec.findNode nodes state.dragId
    in
    case drag
          |> Maybe.andThen stateIfMatchesTarget
          |> Maybe.andThen findTargetPath of
      Just targetPath ->
        let
          updatedNodes = updateNodePosition nodes targetPath (dx, dy)

          bias = getBeaconBias dy
          mbeaconPath = findClosestBeaconPath targetPath geometry bias
          newPath = Maybe.withDefault (AtIndex 0) mbeaconPath
          cmd = maybeCmd (targetPath /= newPath) portRafAlign

          newNodes = TreeSpec.moveNode updatedNodes targetPath newPath
        in
        (appState, Children newNodes, cmd)
      Nothing ->
        (stopDrag appState, children, Cmd.none)

applyDragStop : AppState a -> Children -> (AppState a, Children, Cmd Msg)
applyDragStop ({ action } as appState) children =
  if action == UserAction.Dragging then
    (stopDrag appState, children, Cmd.none)
  else
    (appState, children, Cmd.none)

onDragStartSubscription : Sub Msg
onDragStartSubscription =
  portOnDragStart
    (Decoder.decodeValue onDragDecoder >> toMsgOrNoop MsgOnDragStart MsgNoop)

onDragBySubscription : Sub Msg
onDragBySubscription =
  portOnDragBy
    (Decoder.decodeValue onDragDecoder >> toMsgOrNoop MsgOnDragBy MsgNoop)

onDragStopSubscription : Sub Msg
onDragStopSubscription =
  portOnDragStop (\_ -> MsgOnDragStop)

beaconDecoder : Decoder Beacon
beaconDecoder =
  succeed Beacon
    |> required "path" pathDecoder
    |> required "location" vectorDecoder

geometryDecoder : Decoder Geometry
geometryDecoder =
  succeed Geometry
    |> required "target" rectDecoder
    |> optional "beacons" (list beaconDecoder) []

onDragDecoder : Decoder OnDragData
onDragDecoder =
  succeed OnDragData
    |> required "targetId" idAttributeDecoder
    |> optional "dx" float 0
    |> optional "dy" float 0
    |> required "geometry" geometryDecoder

onDragAttribute : NodeId -> Attribute Msg
onDragAttribute id =
  custom "pointerdown" (onDragPointerDownDecoder id)

onDragPointerDownDecoder : NodeId -> Decoder (MsgUtils.MsgWithEventOptions Msg)
onDragPointerDownDecoder targetId =
  Decoder.map (MsgOnDragPointerDown >> MsgUtils.andStopPropagation)
    (succeed OnPointerDownPortData
      |> hardcoded (idToAttribute targetId)
      |> required "pointerType" string
      |> required "clientX" float
      |> required "clientY" float)
