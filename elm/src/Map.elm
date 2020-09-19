port module Map exposing (main)

import Debug
import Browser
import Html exposing (Html, div, text)
import Html.Attributes exposing (class, classList, style, attribute, id)
import Html.Events exposing (custom)
import Json.Decode as Decoder exposing (Decoder, succeed, int, string, float, list)
import Json.Decode.Pipeline exposing (required, optional, hardcoded)
import MMTree exposing (Path(..))

{- TODOs
 - I think it's overkill to have Vector and not array
 - Refactor a whole lot of this into separate decoders module
 - Test everything
 - Move path functionality into something like MMTree.Path
 - Gotta figure out an elegant way to have view with beacons and view without
 - maybe write some comments or documentation
 - the beacon finding anchor should depend on where the drag is moving:
    moving down: maybe bot left corner, moving up: maybe top left corner
 - beacon finding should filter to ignore beacons to the right so that
    nodes don't attach as children so much
 -}

{- Thoughts
 - When dragging, I need to draw two version of the dragged node:
   - anchored to a beacon (maybe)
   - under the mouse cursor
   Because of how I've set this up, the 'id' should be on the dragged
   node under the cursor, since js will port over the position information
   and that's what we should use to figure out where to anchor the element
 -}

type Msg
  = MsgNoop
  | MsgOnDragStart OnDragData
  | MsgOnDragBy OnDragData
  | MsgOnDragStop
  | MsgOnPointerDown OnPointerDownPortData


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

type alias MsgWithEventOptions =
  { message: Msg
  , stopPropagation: Bool
  , preventDefault: Bool
  }

toPreventDefaultMsg : Msg -> MsgWithEventOptions
toPreventDefaultMsg msg =
  { message = msg
  , stopPropagation = True
  , preventDefault = False
  }

-- Functionality
onPointerDownDecoder : String -> Decoder MsgWithEventOptions
onPointerDownDecoder targetId =
  Decoder.map toPreventDefaultMsg
    (Decoder.map MsgOnPointerDown 
      (succeed OnPointerDownPortData
        |> hardcoded targetId
        |> required "pointerType" string
        |> required "clientX" float
        |> required "clientY" float))

port portOnPointerDown : OnPointerDownPortData -> Cmd msg
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
                 , children = Children [ { id = "e3"
                                         , nodeType = Child
                                         , position = { x = 0, y = 0 }
                                         , size = { x = 200, y = 50 }
                                         , children = Children [ { id = "e4"
                                                                 , nodeType = Child
                                                                 , position = { x = 0, y = 0 }
                                                                 , size = { x = 200, y = 50 }
                                                                 , children = Children []
                                                                 }
                                                               ]
                                         },
                                         { id = "e5"
                                         , nodeType = Child
                                         , position = { x = 0, y = 0 }
                                         , size = { x = 200, y = 50 }
                                         , children = Children []
                                         }
                                       ]
                 }
               , { id = "e2"
                 , nodeType = TopLevel
                 , position = { x = 300, y = 20 }
                 , size = { x = 200, y = 50 }
                 , children = Children []
                 }
               ]
  , dragState = Nothing
  }

nodeAtById : List Node -> String -> Maybe Node
nodeAtById nodes id =
  case findNode nodes id of
    Just path ->
      nodeAt nodes path
    Nothing ->
      Nothing

view : Model -> Html Msg
view model =
  let
      nodes = childList model.nodes
      drawBeacons = model.dragState /= Nothing
      divChildren = List.indexedMap (viewTopNode drawBeacons model.dragState) nodes
  in
  case model.dragState of
    Just state ->
      let
          mnode = nodeAtById (childList model.nodes) state.dragId
      in
      case mnode of
        Just node ->
          div [ class "map" ] ((viewDragNode node) :: divChildren)
        Nothing ->
          div [ class "map" ] divChildren
    Nothing ->
      div [ class "map" ] divChildren

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
  in
  div
    [ id nodeId
      , classList [("top_child", True), ("shadow", shadow), ("on_top", onTop)]
      , style "left" (asPx node.position.x)
      , style "top" (asPx node.position.y)
    ]
    [ div
      [ custom "pointerdown" (onPointerDownDecoder node.id)
      , class "content"
      , style "width" (asPx node.size.x)
      , style "height" (asPx node.size.y)
      ]
      [ text ("hello " ++ node.id)
      ]
    , div
      [ class "child_area" ]
      ((childList node.children |> List.indexedMap (viewChildNode drawChildBeacons path mdragState) |> List.concat) ++
       tailBeacons)
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

  in
  headBeacons ++
  [ div []
      [ div
          [ id node.id
          , classList [("child", True), ("shadow", shadow)]
          , custom "pointerdown" (onPointerDownDecoder node.id)
          , style "width" (asPx node.size.x)
          , style "height" (asPx node.size.y)
          ]
          [ div [ class "content" ] [ text ("hello " ++ node.id) ]
          ]
       , div
         [ class "child_area" ]
         ((childList node.children |> List.indexedMap (viewChildNode drawChildBeacons path mdragState) |> List.concat) ++
          tailBeacons)
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


findClosestBeaconPath : Path -> Geometry -> Maybe Path
findClosestBeaconPath ignorePath geometry =
  let
    validPath path =
      not (isSubpath path ignorePath)

    filteredBeacons = List.filter (\beacon -> validPath beacon.path) geometry.beacons

    tx = geometry.target.position.x
    ty = geometry.target.position.y + 0.5 * geometry.target.size.y

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
  in
  case List.head sorted of
    Just distanceBeacon ->
      if distanceBeacon.distance > 200 then
        Nothing
      else
        Just distanceBeacon.path
    Nothing ->
      Nothing

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

-- TODO(vmpstr): definitely refactor this.
applyDragByData : Maybe DragState -> Children -> OnDragData -> (Maybe DragState, Children)
applyDragByData mdragState (Children nodes) { targetId, dx, dy, geometry } =
  case mdragState of
    Nothing ->
      (Nothing, Children nodes)
    Just dragState ->
      if targetId /= dragState.dragId then
        (Nothing, Children nodes)
      else
        let 
          mtargetPath = findNode nodes targetId
        in
        case mtargetPath of
          Just path ->
            let
              mbeaconPath = findClosestBeaconPath path geometry
              updatedNodes = updateNodePosition nodes path (dx, dy)
            in
            case mbeaconPath of
              Just beaconPath ->
                (mdragState, Children (moveNode updatedNodes path beaconPath))
              Nothing ->
                {- the problem is that if we do a move, we need to somehow force a
                   raf, because ignored path changes, so we end up using self
                   beacons. The "fix" is to not reorder top level items, which
                   only fixes it for some cases, but it's "good enough". The right
                   solution here is to not ever draw self beacons for neither the
                   dragged element nor its shadow.
                   TODO(vmpstr): Do the right solution.
                -}
                case path of
                  AtIndex _ ->
                    (mdragState, Children updatedNodes)
                  InSubtree _ _ ->
                    (mdragState, Children (moveNode updatedNodes path (AtIndex 0)))
          Nothing ->
            (Nothing, Children nodes)

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
        (dragState, nodes) = applyDragByData model.dragState model.nodes data
      in
      nocmd { model | nodes = nodes, dragState = dragState }

    MsgOnDragStop ->
      nocmd { model | dragState = Nothing }

    _ ->
      (model, Cmd.none)

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


