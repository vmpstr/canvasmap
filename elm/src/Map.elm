port module Map exposing (main)

import Debug
import Browser
import Html exposing (Html, div, text)
import Html.Attributes exposing (class, classList, style, attribute, id)
import Html.Events exposing (custom, on)
import Json.Decode as Decoder exposing (Decoder, succeed, int, string, float, list, field)
import Json.Decode.Pipeline exposing (required, optional, hardcoded)
import MMTree exposing (Path(..))
import Maybe.Extra

{- TODOs
 - I think it's overkill to have Vector and not array
 - Refactor a whole lot of this into separate decoders module
 - Test everything
 - Move path functionality into something like MMTree.Path
 - maybe write some comments or documentation
 - the beacon finding anchor should depend on where the drag is moving:
    moving down: maybe bot left corner, moving up: maybe top left corner
 - beacon finding should filter to ignore beacons to the right so that
    nodes don't attach as children so much
 - need custom hover to avoid glitchy render?
 -}

type Msg
  = MsgNoop
  | MsgOnDragStart OnDragData
  | MsgOnDragBy OnDragData
  | MsgOnDragStop
  | MsgOnPointerDown OnPointerDownPortData
  | MsgOnChildEdgeHeightChanged OnChildEdgeHeightChangedData


type alias Vector = { x : Float, y : Float }
type alias Rect =
  { position : Vector
  , size : Vector
  }

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

type NodeType 
  = TopLevel
  | Child

type Children = Children (List Node)

type alias Node =
  { id : String
  , nodeType : NodeType
  , position : Vector
  , size : Vector
  , childEdgeHeight: Float
  , children : Children
  }
 

type alias Model =
  { nodes : Children
  , dragState : Maybe DragState
  }

type alias DragState =
  { dragId : String
  }

-- MMTree customization
findNode = MMTree.findNode childList

moveNode = MMTree.moveNode Children childList

updateNode = MMTree.updateNode Children childList

nodeAt = MMTree.nodeAt childList

-- Helpers
childList : Children -> List Node
childList (Children nodes) =
  nodes

asPx : Float -> String
asPx n =
  String.fromInt (round n) ++ "px"

toMsgOrNoop : (data -> Msg) -> Result err data -> Msg
toMsgOrNoop toMsg result =
  case result of
      Ok data ->
        toMsg data

      Err _ ->
        MsgNoop


type alias OnPointerDownPortData =
  { targetId : String
  , pointerType : String
  , x : Float
  , y : Float
  }

type alias OnChildEdgeHeightChangedData =
  { targetId : String
  , height: Float
  }

type alias MsgWithEventOptions =
  { message: Msg
  , stopPropagation: Bool
  , preventDefault: Bool
  }

toStopPropagationMsg : Msg -> MsgWithEventOptions
toStopPropagationMsg msg =
  { message = msg
  , stopPropagation = True
  , preventDefault = False
  }

-- Functionality
onPointerDownDecoder : String -> Decoder MsgWithEventOptions
onPointerDownDecoder targetId =
  Decoder.map (MsgOnPointerDown >> toStopPropagationMsg)
    (succeed OnPointerDownPortData
      |> hardcoded targetId
      |> required "pointerType" string
      |> required "clientX" float
      |> required "clientY" float)

onChildEdgeHeightChangedDecoder : String -> Decoder Msg
onChildEdgeHeightChangedDecoder targetId =
  Decoder.map MsgOnChildEdgeHeightChanged
    (succeed OnChildEdgeHeightChangedData
      |> hardcoded targetId
      |> required "detail" (field "height" float))

port portOnPointerDown : OnPointerDownPortData -> Cmd msg
port portRafAlign : () -> Cmd msg
port portOnDragStart : (Decoder.Value -> msg) -> Sub msg
port portOnDragBy : (Decoder.Value -> msg) -> Sub msg
port portOnDragStop : (Decoder.Value -> msg) -> Sub msg

initModel : Model
initModel =
  { nodes =
      Children [ { id = "e1"
                 , nodeType = TopLevel
                 , position = { x = 10, y = 10 }
                 , size = { x = 200, y = 50 }
                 , childEdgeHeight = 30
                 , children = Children [ { id = "e3"
                                         , nodeType = Child
                                         , position = { x = 0, y = 0 }
                                         , size = { x = 200, y = 50 }
                                         , childEdgeHeight = 30
                                         , children = Children [ { id = "e4"
                                                                 , nodeType = Child
                                                                 , position = { x = 0, y = 0 }
                                                                 , size = { x = 200, y = 50 }
                                                                 , childEdgeHeight = 30
                                                                 , children = Children []
                                                                 }
                                                               ]
                                         },
                                         { id = "e5"
                                         , nodeType = Child
                                         , position = { x = 0, y = 0 }
                                         , size = { x = 200, y = 50 }
                                         , childEdgeHeight = 30
                                         , children = Children []
                                         }
                                       ]
                 }
               , { id = "e2"
                 , nodeType = TopLevel
                 , position = { x = 300, y = 20 }
                 , size = { x = 200, y = 50 }
                 , childEdgeHeight = 30
                 , children = Children []
                 }
               ]
  , dragState = Nothing
  }

nodeAtById : List Node -> String -> Maybe Node
nodeAtById nodes id =
  findNode nodes id |> Maybe.andThen (nodeAt nodes)

getDragNode : List Node -> DragState -> Maybe Node
getDragNode nodes dragState =
  nodeAtById nodes dragState.dragId

view : Model -> Html Msg
view model =
  let
      nodes = childList model.nodes
      drawBeacons = model.dragState /= Nothing
      childrenViewList = List.indexedMap (viewTopNode drawBeacons model.dragState) nodes
      dragViewList =
        List.map viewDragNode
          (model.dragState
            |> Maybe.andThen (getDragNode nodes)
            |> Maybe.Extra.toList)
  in
  div [ class "map" ] (dragViewList ++ childrenViewList)

viewDragNode : Node -> Html Msg
viewDragNode node =
  viewTopNode False Nothing -1 node

getViewParams : Bool -> Maybe DragState -> Node -> (String, Bool, Bool)
getViewParams drawBeacons mdragState node =
  -- returning id, shadow, drawChildBeacons
  case mdragState of
    Just dragState ->
      if dragState.dragId == node.id then
        ("shadow-" ++ node.id, True, False)
      else
        (node.id, False, drawBeacons)
    Nothing ->
      (node.id, False, drawBeacons)

viewNodeContents : Node -> Html Msg
viewNodeContents node =
  div
    [ custom "pointerdown" (onPointerDownDecoder node.id)
    , class "selection_container"
    ]
    [ div
        [ class "contents_container" ]
        [ div
            [ class "label" ]
            [ text ("hello " ++ node.id) ]
        ]
    ]

viewTopNode : Bool -> Maybe DragState -> Int -> Node -> Html Msg
viewTopNode drawBeacons mdragState index node =
  let
    path = String.fromInt index
    (nodeId, shadow, drawChildBeacons) = getViewParams drawBeacons mdragState node
    onTop = index < 0

    tailBeacons =
      if drawChildBeacons then
        [viewBeacon (path ++ " " ++ (List.length (childList node.children) |> String.fromInt))]
      else
        []

    childNodes =
      childList node.children
        |> List.indexedMap (viewChildNode drawChildBeacons path mdragState)
        |> List.concat
  in
  div
    [ id nodeId
      , class "top_child"
      , classList [("shadow", shadow), ("on_top", onTop)]
      , style "left" (asPx node.position.x)
      , style "top" (asPx node.position.y)
    ]
    [ viewNodeContents node
    , div
        [ class "child_holder" ]
        [ div 
            [ class "child_edge"
            , style "height" (asPx node.childEdgeHeight)
            ] []
        , Html.node "child-area"
            [ class "child_area"
            , on "childedgeheightchanged" (onChildEdgeHeightChangedDecoder node.id)
            ]
            (childNodes ++ tailBeacons)
        ]
    ]

viewChildNode : Bool -> String -> Maybe DragState -> Int -> Node -> List (Html Msg)
viewChildNode drawBeacons parentPath mdragState index node =
  let
    path = parentPath ++ " " ++ String.fromInt index
    (nodeId, shadow, drawChildBeacons) = getViewParams drawBeacons mdragState node

    headBeacons =
      if drawBeacons then
        [viewBeacon path]
      else
        []

    tailBeacons =
      if drawChildBeacons then
        [viewBeacon (path ++ " " ++ (List.length (childList node.children) |> String.fromInt))]
      else
        []

    childNodes =
       childList node.children
         |> List.indexedMap (viewChildNode drawChildBeacons path mdragState)
         |> List.concat
  in
  headBeacons ++
  [ div []
      [ div
          [ id node.id
          , classList [("child", True), ("shadow", shadow)]
          ]
          [ viewNodeContents node
          , div [ class "parent_edge" ] []
          ]
      , div
          [ class "child_holder" ]
          [ div 
              [ class "child_edge"
              , style "height" (asPx node.childEdgeHeight)
              ] []
          , Html.node "child-area"
              [ class "child_area"
              , on "childedgeheightchanged" (onChildEdgeHeightChangedDecoder node.id)
              ]
              (childNodes ++ tailBeacons)
          ]
       ]
   ]

viewBeacon : String -> Html Msg
viewBeacon path =
  div [ class "beacon"
      , attribute "path" path
      ] []


isSubpath : Path -> Path -> Bool
isSubpath path lead =
  case (path, lead) of
    (AtIndex pi, AtIndex li) ->
      False -- even if pi == li, it's not a subpath
    (AtIndex pi, InSubtree li lsub) ->
      False -- path stops short of the lead
    (InSubtree pi psub, AtIndex li) ->
      pi == li -- if path goes into the subtree of lead, it's a subpath
    (InSubtree pi psub, InSubtree li lsub) ->
      if pi == li then
        isSubpath psub lsub -- recurse
      else
        False -- path diverges


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

applyChildEdgeHeightChange : Children -> OnChildEdgeHeightChangedData -> Children
applyChildEdgeHeightChange (Children nodes) { targetId, height } =
  let
      mpath = findNode nodes targetId
      updater node = { node | childEdgeHeight = height }
  in
  case mpath of
    Just path ->
      Children (updateNode nodes path updater)
    Nothing ->
      Children nodes

applyDragStartData : Maybe DragState -> Children -> OnDragData -> (Maybe DragState, Children)
applyDragStartData mdragState (Children nodes) { targetId, geometry } =
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

applyDragByData : Maybe DragState -> Children -> OnDragData -> (Maybe DragState, Children, Bool)
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

nocmd : Model -> (Model, Cmd Msg)
nocmd model =
  (model, Cmd.none)

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    MsgOnPointerDown data ->
      (model, portOnPointerDown data)

    MsgOnDragStart data ->
      let
        (dragState, nodes) = applyDragStartData model.dragState model.nodes data
      in
      nocmd { model | nodes = nodes, dragState = dragState }

    MsgOnDragBy data ->
      let
        (dragState, nodes, rafAlign) = applyDragByData model.dragState model.nodes data
        cmd = 
          if rafAlign then
            portRafAlign ()
          else
            Cmd.none
      in
      ({ model | nodes = nodes, dragState = dragState }, cmd)

    MsgOnDragStop ->
      nocmd { model | dragState = Nothing }

    MsgOnChildEdgeHeightChanged data ->
      nocmd { model | nodes = applyChildEdgeHeightChange model.nodes data }

    _ ->
      nocmd model

init : () -> (Model, Cmd Msg)
init () = (initModel, Cmd.none)

prependPath : Int -> Maybe Path -> Path
prependPath index maybePath =
  case maybePath of
    Just path ->
      InSubtree index path
    Nothing ->
      AtIndex index

stringToPath : String -> Maybe Path
stringToPath s =
  let
    stringList = String.split " " s
    intList = List.filterMap String.toInt (String.split " " s)

    maybePrepend index mpath =
      Just (prependPath index mpath)
  in
  if List.length stringList == List.length intList then
    List.foldr maybePrepend Nothing intList
  else
    Nothing

decodePath : String -> Decoder Path
decodePath s =
  case stringToPath s of
    Just path ->
      succeed path
    Nothing ->
      Decoder.fail ("Invalid path: " ++ s)

pathDecoder : Decoder Path
pathDecoder =
  string |> Decoder.andThen decodePath

beaconDecoder : Decoder Beacon
beaconDecoder =
  succeed Beacon
    |> required "path" pathDecoder
    |> required "location" vectorDecoder

vectorDecoder : Decoder Vector
vectorDecoder =
  succeed Vector
    |> required "x" float
    |> required "y" float

rectDecoder : Decoder Rect
rectDecoder =
  succeed Rect
    |> required "position" vectorDecoder
    |> required "size" vectorDecoder

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

onDragStartSubscription : Sub Msg
onDragStartSubscription =
  portOnDragStart (Decoder.decodeValue onDragDecoder >> (toMsgOrNoop MsgOnDragStart))

onDragBySubscription : Sub Msg
onDragBySubscription =
  portOnDragBy (Decoder.decodeValue onDragDecoder >> (toMsgOrNoop MsgOnDragBy))

onDragStopSubscription : Sub Msg
onDragStopSubscription =
  portOnDragStop (\_ -> MsgOnDragStop)

subscriptions : Model -> Sub Msg
subscriptions model =
  [ onDragStartSubscription
  , onDragBySubscription
  , onDragStopSubscription
  ] |> Sub.batch

main : Program () Model Msg
main =
    Browser.element
      { init = init
      , view = view
      , update = update
      , subscriptions = subscriptions
      }


