port module Map exposing (main)

import Debug
import Browser
import Html exposing (Html, div, text)
import Html.Attributes exposing (class, style, attribute, id)
import Html.Events exposing (custom)
import Json.Decode as Decoder exposing (Decoder, succeed, int, string, float, list)
import Json.Decode.Pipeline exposing (required, optional, hardcoded)
import MMTree exposing (Path(..))

{- TODOs
 - I think it's overkill to have Vector and not array
 - Refactor a whole lot of this into separate decoders module
 - Test everything
 - Move path functionality into something like MMTree.Path
 - Model.drag_id should be drag_path?
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
  | MsgOnDrag OnDragData
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
  , drag_id : Maybe String
  }

-- MMTree customization
findNode = MMTree.findNode childList

moveNode = MMTree.moveNode Children childList

updateNode = MMTree.updateNode Children childList

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
port portOnDrag : (Decoder.Value -> msg) -> Sub msg

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
  , drag_id = Nothing
  }

view : Model -> Html Msg
view model =
  div [ class "map" ]
      (childList model.nodes |> List.indexedMap viewTopNode)


viewTopNode : Int -> Node -> Html Msg
viewTopNode index node =
  let
    path = String.fromInt index
  in
  div
    [ id node.id
      , class "top_child"
      , style "left" (asPx node.position.x)
      , style "top" (asPx node.position.y)
    ]
    [ div
      [ custom "pointerdown" (onPointerDownDecoder node.id)
      , class "content"
      , style "width" (asPx node.size.x)
      , style "height" (asPx node.size.y)
      ]
      [ text "hello"
      ]
    , div
      [ class "child_area" ]
      ((childList node.children |> List.indexedMap (viewChildNode path) |> List.concat) ++
       [viewBeacon (path ++ " " ++ (List.length (childList node.children) |> String.fromInt))])
    ]

viewChildNode : String -> Int -> Node -> List (Html Msg)
viewChildNode parentPath index node =
  let
    path = parentPath ++ " " ++ String.fromInt index
  in
  [ viewBeacon path
  , div []
      [ div
          [ id node.id
          , class "child"
          , custom "pointerdown" (onPointerDownDecoder node.id)
          , style "width" (asPx node.size.x)
          , style "height" (asPx node.size.y)
          ]
          [ div [ class "content" ] [ text "hello" ]
          ]
       , div
         [ class "child_area" ]
         ((childList node.children |> List.indexedMap (viewChildNode path) |> List.concat) ++
          [viewBeacon (path ++ " " ++ (List.length (childList node.children) |> String.fromInt))])
       ]
   ]

viewBeacon : String -> Html Msg
viewBeacon path =
  div [ class "beacon"
      , attribute "path" path
      ] []

findClosestBeacon : Path -> Geometry -> Maybe Beacon
findClosestBeacon path geometry =
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
            position = Debug.log "abs pos " (Vector x y)
        in
        { node | position = position }
  in
  updateNode nodes path setPosition

dragPosition : OnDragData -> Children -> Children
dragPosition { targetId, dx, dy, geometry } (Children nodes) =
  let 
    mtargetPath = findNode nodes targetId
  in
  case mtargetPath of
    Just path ->
      let
        mbeacon = findClosestBeacon path geometry
        updatedNodes =
          case path of
            AtIndex index ->
              updateNodePosition nodes path (dx, dy)
            InSubtree _ _ ->
              setNodePosition nodes path (geometry.target.position.x + dx, geometry.target.position.y + dy)
      in
      case mbeacon of
        Just beacon ->
          Children (moveNode updatedNodes path beacon.path)
        Nothing ->
          Children (moveNode updatedNodes path (AtIndex 0))
    Nothing ->
      Children nodes

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    MsgOnPointerDown data ->
      (model, portOnPointerDown data )

    MsgOnDrag data ->
      ({ model | nodes = dragPosition data model.nodes }, Cmd.none)

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
    |> required "beacons" (list beaconDecoder)

onDragDecoder : Decoder OnDragData
onDragDecoder =
  succeed OnDragData
    |> required "targetId" string
    |> required "dx" float
    |> required "dy" float
    |> required "geometry" geometryDecoder

onDragSubscription : Model -> Sub Msg
onDragSubscription model =
  portOnDrag (Decoder.decodeValue onDragDecoder >> (toMsgOrNoop MsgOnDrag))

subscriptions : Model -> Sub Msg
subscriptions model =
  [ onDragSubscription model
  ] |> Sub.batch

main : Program () Model Msg
main =
    Browser.element
      { init = init
      , view = view
      , update = update
      , subscriptions = subscriptions
      }


