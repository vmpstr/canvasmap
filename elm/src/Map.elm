module Map exposing (main)

import Browser
import Html exposing (Html, div)

type Msg
  = MsgNoop
  | MsgOnDrag DragData

type alias Vector = { x : Float, y : Float }

type alias DragData =
  { targetId : String
  , delta : Vector
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
  { nodes : List Node
  }

initModel : Model
initModel =
  { nodes = []
  }

view : Model -> Html Msg
view model =
  div [] []

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
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
