port module DragControl exposing (Msg, State, update, subscriptions, getDragNode)

import Json.Decode as Decoder exposing (Decoder, succeed, string, float, list)
import Json.Decode.Pipeline exposing (required, optional)

import Geometry exposing (Vector, Rect, vectorDecoder, rectDecoder)
import Node exposing (Children(..), childList, Node)
import Tree exposing (Path(..), pathDecoder, isSubpath)

{- TODOs
 - Maybe beacons should have Path but really should just reference ids
   "before X", "childOf X", etc which means this module doesn't have to
   depend on Tree
 -}

-- Exposed
type Msg
  = MsgNoop
  | MsgOnDragStart OnDragData
  | MsgOnDragBy OnDragData
  | MsgOnDragStop

type alias State =
  { dragId : String
  }

-- Internal
type alias OnDragData =
  { targetId : String
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

port portOnDragStart : (Decoder.Value -> msg) -> Sub msg
port portOnDragBy : (Decoder.Value -> msg) -> Sub msg
port portOnDragStop : (Decoder.Value -> msg) -> Sub msg

updateNode : List Node -> Path -> (Node -> Node) -> List Node
updateNode = Tree.updateNode Children childList

findNode : List Node -> String -> Maybe Path
findNode = Tree.findNode childList

moveNode : List Node -> Path -> Path -> List Node
moveNode = Tree.moveNode Children childList

nodeAtById : List Node -> String -> Maybe Node
nodeAtById = Tree.nodeAtById childList

toMsgOrNoop : (data -> Msg) -> Result err data -> Msg
toMsgOrNoop toMsg result =
  case result of
      Ok data ->
        toMsg data
      Err _ ->
        MsgNoop

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
      let
          bx = beacon.location.x
          by = beacon.location.y
      in
      sqrt ((bx - tx) * (bx - tx) + (by - ty) * (by - ty))

    toDistanceBeacon beacon =
      { distance = computeDistance beacon
      , path = beacon.path
      }

    distanceBeacons = List.map toDistanceBeacon filteredBeacons

    sorted = List.sortBy .distance distanceBeacons

    pathIfClose distanceBeacon =
      if distanceBeacon.distance <= 200 then
        Just distanceBeacon.path
      else
        Nothing
  in
  List.head sorted |> Maybe.andThen pathIfClose

updateNodePosition : List Node -> Path -> (Float, Float) -> List Node
updateNodePosition nodes path (dx, dy) =
  let
      addDelta node =
        let
            x = node.position.x + dx
            y = node.position.y + dy
            position = Vector x y
        in
        { node | position = position }
  in
  updateNode nodes path addDelta

setNodePosition : List Node -> Path -> (Float, Float) -> List Node
setNodePosition nodes path (x, y) =
  let
      setPosition node =
        let
            position = Vector x y
        in
        { node | position = position }
  in
  updateNode nodes path setPosition

applyDragStartData : Maybe State -> Children -> OnDragData -> (Maybe State, Children)
applyDragStartData _ (Children nodes) { targetId, geometry } =
  let
    mtargetPath = findNode nodes targetId
  in
  case mtargetPath of
    Just path ->
      ( Just { dragId = targetId }
      , Children (setNodePosition nodes path (geometry.target.position.x, geometry.target.position.y))
      )
    Nothing ->
      (Nothing, Children nodes)

applyDragByData : Maybe State -> Children -> OnDragData -> (Maybe State, Children, Bool)
applyDragByData mdragState (Children nodes) { targetId, dx, dy, geometry } =
  let
      stateIfMatchesTarget dragState =
        if dragState.dragId == targetId then
          Just dragState
        else
          Nothing

      findTargetPath dragState =
        findNode nodes dragState.dragId
  in
  case mdragState
        |> Maybe.andThen stateIfMatchesTarget
        |> Maybe.andThen findTargetPath of
    Just targetPath ->
      let
        bias =
          if dy < 0 then
            BiasUp
          else if dy > 0 then
            BiasDown
          else
            BiasMid

        mbeaconPath = findClosestBeaconPath targetPath geometry bias
        updatedNodes = updateNodePosition nodes targetPath (dx, dy)

        newPath =
          case mbeaconPath of
            Just beaconPath ->
              beaconPath
            Nothing ->
              AtIndex 0
      in
      (mdragState, Children (moveNode updatedNodes targetPath newPath), targetPath /= newPath)
    Nothing ->
      (Nothing, Children nodes, False)

port portRafAlign : () -> Cmd msg

update : Msg -> Maybe State -> Children -> (Maybe State, Children, Cmd Msg)
update msg mdragState nodes =
  case msg of
    MsgOnDragStart data ->
      let
        (dragState, newNodes) = applyDragStartData mdragState nodes data
      in
      (dragState, newNodes, Cmd.none)

    MsgOnDragBy data ->
      let
        (dragState, newNodes, rafAlign) = applyDragByData mdragState nodes data
        cmd =
          if rafAlign then
            portRafAlign ()
          else
            Cmd.none
      in
      (dragState, newNodes, cmd)

    MsgOnDragStop ->
      (Nothing, nodes, Cmd.none)

    MsgNoop ->
      (mdragState, nodes, Cmd.none)

onDragStartSubscription : Sub Msg
onDragStartSubscription =
  portOnDragStart (Decoder.decodeValue onDragDecoder >> toMsgOrNoop MsgOnDragStart)

onDragBySubscription : Sub Msg
onDragBySubscription =
  portOnDragBy (Decoder.decodeValue onDragDecoder >> toMsgOrNoop MsgOnDragBy)

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
    |> required "targetId" string
    |> optional "dx" float 0
    |> optional "dy" float 0
    |> required "geometry" geometryDecoder

subscriptions: () -> Sub Msg
subscriptions () =
  [ onDragStartSubscription
  , onDragBySubscription
  , onDragStopSubscription
  ] |> Sub.batch

getDragNode : List Node -> Maybe State -> Maybe Node
getDragNode nodes mdragState =
  mdragState |> Maybe.andThen
    (\state -> nodeAtById nodes state.dragId)

