port module Toy exposing (main)

import Draggable
import Draggable.Events
import Html exposing (div)
import Html.Attributes exposing (class, style, id)
import Browser
import Json.Decode as Decode
import Json.Decode.Pipeline exposing (required)
import Debug

type Msg 
  = MsgNoop
  | MsgOnDragStart DragIdType
  | MsgOnDragBy Draggable.Delta
  | MsgOnDragEnd
  | MsgDraggableInternal (Draggable.Msg DragIdType)
  | MsgSizeChanged SizeChangedData

type DragIdType
  = DragSelf String
  | DragEWSize String

topChildToHtml : TopChild -> Html.Html Msg
topChildToHtml child =
  let
      (left, top) = child.position
      (width, height) = child.size
  in
  div
    [ id child.id
    , class "topchild"
    , Draggable.mouseTrigger (DragSelf child.id) MsgDraggableInternal
    , style "left" (String.fromInt left ++ "px")
    , style "top" (String.fromInt top ++ "px")
    , style "width" (String.fromInt width ++ "px")
    , style "height" (String.fromInt height ++ "px")
    ]
    [ div
        [ class "ewhandle"
        , Draggable.mouseTrigger (DragEWSize child.id) MsgDraggableInternal
        ]
        []
    ]

view : Model -> Html.Html Msg
view model =
  div
    [ class "map" ]
    (List.map topChildToHtml model.children)

nocmd : Model -> ( Model, Cmd msg )
nocmd model = ( model, Cmd.none )

port sizeChanged  : (Decode.Value -> msg) -> Sub msg
port onElementCreated : List String -> Cmd msg

type alias SizeChangedData =
  { id : String
  , size : List Float
  }

sizeChangeDecoder : Decode.Decoder SizeChangedData
sizeChangeDecoder =
  Decode.succeed SizeChangedData
    |> required "id" Decode.string
    |> required "size" (Decode.list Decode.float)

dragConfig : Draggable.Config DragIdType Msg
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

dragChildBy : List TopChild -> String -> Draggable.Delta -> (List TopChild)
dragChildBy children id delta =
  case children of
    (firstChild :: rest) ->
      if firstChild.id == id then
        [adjustPosition firstChild delta] ++ rest
      else
        [firstChild] ++ (dragChildBy rest id delta)

    [] ->
      []

adjustSize : List TopChild -> String -> List Float -> List TopChild
adjustSize children id size =
    case children of
      (firstChild :: rest) ->
        if firstChild.id == id then
          case size of
            (width :: height :: []) ->
              [{ firstChild | size = (round width, round height) }] ++ rest

            _ ->
               children
        else
          [firstChild] ++ (adjustSize rest id size)

      [] ->
        []

adjustChildSize : TopChild -> Draggable.Delta -> TopChild
adjustChildSize child (dw, dh) =
    let
        (w, h) = child.size
        size = (round (toFloat w + dw), round (toFloat h + dh))
    in
    { child | size = size }

resizeChildBy : List TopChild -> String -> Draggable.Delta -> (List TopChild)
resizeChildBy children id delta =
  case children of
    (firstChild :: rest) ->
      if firstChild.id == id then
        [adjustChildSize firstChild delta] ++ rest
      else
        [firstChild] ++ (resizeChildBy rest id delta)

    [] ->
      []

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
  case msg of
    MsgNoop ->
      nocmd model

    MsgOnDragStart id -> 
        nocmd { model | dragId = Just id }

    MsgOnDragBy delta ->
        case model.dragId of
          Just (DragSelf id) ->
            nocmd { model | children = dragChildBy model.children id delta }

          Just (DragEWSize id) ->
            let
                (dx, dy) = delta
                adjustment = (dx, 0)
            in
            nocmd { model | children = resizeChildBy model.children id adjustment }

          Nothing ->
            nocmd model

    MsgOnDragEnd ->
        nocmd { model | dragId = Nothing }

    MsgDraggableInternal dragMsg ->
        Draggable.update dragConfig dragMsg model

    MsgSizeChanged data ->
        nocmd { model | children = adjustSize model.children data.id data.size }

type alias TopChild =
  { id: String
  , position: (Int, Int)
  , size: (Int, Int)
  }

type alias Model =
  { drag: Draggable.State DragIdType
  , children: List TopChild
  , dragId: Maybe DragIdType
  , nextTopChildId : Int
  }

initModel : Model
initModel =
  { drag = Draggable.init
  , children = 
     [ { id = "tc0", position = (0, 0), size = (200, 50) }
     , { id = "tc1", position = (100, 200), size = (200, 50) }
     ]
  , dragId = Nothing
  , nextTopChildId = 2
  }


toMsgOrNoop : (data -> Msg) -> Result err data -> Msg
toMsgOrNoop toMsg result =
  case result of
      Ok data ->
        toMsg data

      Err _ ->
        MsgNoop

resizeSubscription : Model -> Sub Msg
resizeSubscription model =
  sizeChanged (Decode.decodeValue sizeChangeDecoder >> (toMsgOrNoop MsgSizeChanged))

subscriptions : Model -> Sub Msg
subscriptions model =
  [ Draggable.subscriptions MsgDraggableInternal model.drag
  , resizeSubscription model
  ] |> Sub.batch

main : Program () Model Msg
main =
  Browser.element
      { init = \() -> ( initModel, onElementCreated (List.map .id initModel.children) )
      , view = view
      , update = update
      , subscriptions = subscriptions
      }
