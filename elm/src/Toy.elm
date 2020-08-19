module Toy exposing (main)

import Draggable
import Draggable.Events
import Html exposing (div)
import Html.Attributes exposing (..)
import Browser

type Msg 
  = MsgNoop
  | MsgOnDragStart String
  | MsgOnDragBy Draggable.Delta
  | MsgOnDragEnd
  | MsgDraggableInternal (Draggable.Msg String)

topChildToHtml : TopChild -> Html.Html Msg
topChildToHtml child =
  div
    [ class "topchild"
    , Draggable.mouseTrigger child.id MsgDraggableInternal
    , style "left" (String.fromInt (Tuple.first child.position) ++ "px")
    , style "top" (String.fromInt (Tuple.second child.position) ++ "px")
    ]
    []

view : Model -> Html.Html Msg
view model =
  div
    [ class "map" ]
    (List.map topChildToHtml model.children)

nocmd : Model -> ( Model, Cmd msg )
nocmd model = ( model, Cmd.none )

dragConfig : Draggable.Config String Msg
dragConfig =
    Draggable.customConfig
      [ Draggable.Events.onDragBy MsgOnDragBy
      , Draggable.Events.onDragStart MsgOnDragStart
      , Draggable.Events.onDragEnd MsgOnDragEnd
      ]

adjustPosition : TopChild -> Draggable.Delta -> TopChild
adjustPosition child (dx, dy) =
    let
        (x, y) = child.position
        position = (round (toFloat x + dx), round (toFloat y + dy))
    in
    { child | position = position }

dragChildBy : List TopChild -> Maybe String -> Draggable.Delta -> (List TopChild)
dragChildBy children maybeId delta =
  case maybeId of 
    Just id ->
      case children of
        (firstChild :: rest) ->
          if firstChild.id == id then
            [adjustPosition firstChild delta] ++ rest
          else
            [firstChild] ++ (dragChildBy rest maybeId delta)

        [] ->
          []

    Nothing ->
        children

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
  case msg of
    MsgNoop ->
      nocmd model

    MsgOnDragStart id -> 
        nocmd { model | dragId = Just id }

    MsgOnDragBy delta ->
        nocmd { model | children = dragChildBy model.children model.dragId delta }

    MsgOnDragEnd ->
        nocmd { model | dragId = Nothing }

    MsgDraggableInternal dragMsg ->
        Draggable.update dragConfig dragMsg model

type alias TopChild =
  { id: String
  , position: (Int, Int)
  }

type alias Model =
  { drag: Draggable.State String
  , children: List TopChild
  , dragId: Maybe String
  , nextTopChildId : Int
  }

initModel : Model
initModel =
  { drag = Draggable.init
  , children = 
     [ { id = "tc0", position = (0, 0) }
     , { id = "tc1", position = (100, 200) }
     ]
  , dragId = Nothing
  , nextTopChildId = 2
  }

subscriptions : Model -> Sub Msg
subscriptions model =
  Draggable.subscriptions MsgDraggableInternal model.drag

main : Program () Model Msg
main =
  Browser.element
      { init = \() -> ( initModel, Cmd.none )
      , view = view
      , update = update
      , subscriptions = subscriptions
      }
