port module Map exposing (main)

import Debug
import Browser
import Html exposing (Html, div, text)
import Html.Attributes exposing (class, style)
import Html.Events exposing (onMouseDown)

type Msg
  = MsgNoop
  | MsgOnDrag DragData
  | MsgOnMouseDown String

type alias Vector = { x : Float, y : Float }
type alias Rect =
  { position : Vector
  , size : Vector
  }

type alias DragData =
  { targetId : String
  , delta : Vector
  , geometry : Maybe Geometry
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

port portOnMouseDown : String -> Cmd msg

initModel : Model
initModel =
  { nodes =
      Children [ { id = "e1"
                 , nodeType = TopLevel
                 , position = { x = 10, y = 10 }
                 , size = { x = 200, y = 50 }
                 , children = Children []
                 }
               ]
  }

view : Model -> Html Msg
view model =
  div [ class "map" ]
      (List.map viewNode (childList model.nodes))


viewNode : Node -> Html Msg
viewNode node =
  case node.nodeType of
    TopLevel ->
      div [ onMouseDown (MsgOnMouseDown node.id)
          , class "top_child"
          , style "width" (asPx node.size.x)
          , style "height" (asPx node.size.y)
          , style "left" (asPx node.position.x)
          , style "top" (asPx node.position.y)
          ] [ text "hello" ]

    Child ->
      div [] []

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    MsgOnMouseDown id ->
      (model, portOnMouseDown id)

    _ ->

      (model, Cmd.none)

init : () -> (Model, Cmd Msg)
init () = (initModel, Cmd.none)

subscriptions : Model -> Sub Msg
subscriptions model = Sub.none

main : Program () Model Msg
main =
    Browser.element
      { init = init
      , view = view
      , update = update
      , subscriptions = subscriptions
      }
