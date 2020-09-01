port module Map exposing (main)

import Debug
import Browser
import Html exposing (Html, div, text)
import Html.Attributes exposing (class, style)
import Html.Events exposing (on)
import Json.Decode as Decoder exposing (Decoder, succeed, int, string, float)
import Json.Decode.Pipeline exposing (required, optional, hardcoded)

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
  }

type alias Geometry =
  { target : Rect
  , beacons : List Beacon
  }

type alias Beacon =
  { id : String
  , rect : Rect
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
  }


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

onPointerDownDecoder : String -> Decoder Msg
onPointerDownDecoder targetId =
  Decoder.map MsgOnPointerDown 
    (succeed OnPointerDownPortData
      |> hardcoded targetId
      |> required "pointerType" string
      |> required "clientX" float
      |> required "clientY" float)

port portOnPointerDown : OnPointerDownPortData -> Cmd msg
port portOnDrag : (Decoder.Value -> msg) -> Sub msg

initModel : Model
initModel =
  { nodes =
      Children [ { id = "e1"
                 , nodeType = TopLevel
                 , position = { x = 10, y = 10 }
                 , size = { x = 200, y = 50 }
                 , children = Children []
                 }
               , { id = "e2"
                 , nodeType = TopLevel
                 , position = { x = 300, y = 20 }
                 , size = { x = 200, y = 50 }
                 , children = Children []
                 }
               ]
  }

view : Model -> Html Msg
view model =
  div [ class "map" ]
      (childList model.nodes |> List.map viewNode)


viewNode : Node -> Html Msg
viewNode node =
  case node.nodeType of
    TopLevel ->
      div [ on "pointerdown" (onPointerDownDecoder node.id)
          , class "top_child"
          , style "width" (asPx node.size.x)
          , style "height" (asPx node.size.y)
          , style "left" (asPx node.position.x)
          , style "top" (asPx node.position.y)
          ] [ text "hello" ]

    Child ->
      div [] []

dragPosition : OnDragData -> Children -> Children
dragPosition { targetId, dx, dy } (Children nodes) =
  let 
    updatePosition : Vector -> Vector
    updatePosition position =
      { x = position.x + dx, y = position.y + dy }

    updateNode : Node -> Node
    updateNode node =
      if node.id == targetId then
        { node | position = updatePosition node.position }
      else
        node
  in
  Children (List.map updateNode nodes)

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

onDragDecoder : Decoder OnDragData
onDragDecoder =
  succeed OnDragData
    |> required "targetId" string
    |> required "dx" float
    |> required "dy" float

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
