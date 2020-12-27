port module ResizeControl exposing (Msg, subscriptions, update, ewResizer, nsResizer, nsewResizer)

import Json.Decode as Decoder exposing (Decoder, succeed, nullable, float, string)
import Json.Decode.Pipeline exposing (required, optional, hardcoded)
import EventDecodersData exposing (OnPointerDownPortData)
import Utils exposing (toMsgOrNoop)
import Node exposing (Id, Children(..))
import NodeUtils exposing (idAttributeDecoder, idToAttribute)
import UserAction
import Html exposing (Html, div)
import Html.Attributes exposing (class)
import Html.Events exposing (custom)
import TreeSpec

{- TODO:
 - Add a separate resize user state, so that memento can pick this up.
-}

type Msg
  = MsgNoop
  | MsgOnEwResizePointerDown OnPointerDownPortData
  | MsgOnNsResizePointerDown OnPointerDownPortData
  | MsgOnNsewResizePointerDown OnPointerDownPortData
  | MsgOnMaxWidthChanged OnMaxDimensionChangedData
  | MsgOnMaxHeightChanged OnMaxDimensionChangedData

ewResizer : Id -> Html Msg 
ewResizer id =
  div
    [ class "ew_resizer"
    , custom "pointerdown" (onEwResizePointerDown id)
    ] []

nsResizer : Id -> Html Msg 
nsResizer id =
  div
    [ class "ns_resizer"
    , custom "pointerdown" (onNsResizePointerDown id)
    ] []

nsewResizer : Id -> Html Msg 
nsewResizer id =
  div
    [ class "nsew_resizer"
    , custom "pointerdown" (onNsewResizePointerDown id)
    ] []

onMaxDimensionChangedDataDecoder : Decoder OnMaxDimensionChangedData
onMaxDimensionChangedDataDecoder =
  succeed OnMaxDimensionChangedData
    |> required "targetId" idAttributeDecoder
    |> optional "value" (nullable float) Nothing

port portOnMaxWidthChanged : (Decoder.Value -> msg) -> Sub msg
port portOnMaxHeightChanged : (Decoder.Value -> msg) -> Sub msg

onMaxWidthChangedSubscription : Sub Msg
onMaxWidthChangedSubscription =
  portOnMaxWidthChanged
    (Decoder.decodeValue onMaxDimensionChangedDataDecoder >> toMsgOrNoop MsgOnMaxWidthChanged MsgNoop)

onMaxHeightChangedSubscription : Sub Msg
onMaxHeightChangedSubscription =
  portOnMaxHeightChanged
    (Decoder.decodeValue onMaxDimensionChangedDataDecoder >> toMsgOrNoop MsgOnMaxHeightChanged MsgNoop)

subscriptions : () -> Sub Msg
subscriptions () =
  [ onMaxWidthChangedSubscription
  , onMaxHeightChangedSubscription
  ] |> Sub.batch

port portOnEwResizePointerDown : OnPointerDownPortData -> Cmd msg
port portOnNsResizePointerDown : OnPointerDownPortData -> Cmd msg
port portOnNsewResizePointerDown : OnPointerDownPortData -> Cmd msg

update : Msg -> (AppState a, Children) -> (AppState a, Children, Cmd Msg)
update msg (appState, nodes) =
  case msg of
    MsgNoop ->
      (appState, nodes, Cmd.none)

    MsgOnEwResizePointerDown data ->
      (appState, nodes, portOnEwResizePointerDown data)

    MsgOnNsResizePointerDown data ->
      (appState, nodes, portOnNsResizePointerDown data)

    MsgOnNsewResizePointerDown data ->
      (appState, nodes, [ portOnNsResizePointerDown data, portOnEwResizePointerDown data ] |> Cmd.batch)

    MsgOnMaxWidthChanged data ->
      let newNodes = applyMaxWidthChanged nodes data in
      (appState, newNodes, Cmd.none)

    MsgOnMaxHeightChanged data ->
      let newNodes = applyMaxHeightChanged nodes data in
      (appState, newNodes, Cmd.none)


-- Internal
type alias AppState a =
  { a
  | action : UserAction.Action
  }

type alias OnMaxDimensionChangedData =
  { targetId : Id
  , value: Maybe Float
  }

-- TODO: Extract this to msg utils
type alias MsgWithEventOptions =
  { message: Msg
  , stopPropagation: Bool
  , preventDefault: Bool
  }

andStopPropagation : Msg -> MsgWithEventOptions
andStopPropagation msg =
  { message = msg
  , stopPropagation = True
  , preventDefault = False
  }

onEwResizePointerDown : Id -> Decoder MsgWithEventOptions
onEwResizePointerDown targetId =
  Decoder.map (MsgOnEwResizePointerDown >> andStopPropagation)
    (succeed OnPointerDownPortData
      |> hardcoded (idToAttribute targetId)
      |> required "pointerType" string
      |> required "clientX" float
      |> required "clientY" float)

onNsResizePointerDown : Id -> Decoder MsgWithEventOptions
onNsResizePointerDown targetId =
  Decoder.map (MsgOnNsResizePointerDown >> andStopPropagation)
    (succeed OnPointerDownPortData
      |> hardcoded (idToAttribute targetId)
      |> required "pointerType" string
      |> required "clientX" float
      |> required "clientY" float)

onNsewResizePointerDown : Id -> Decoder MsgWithEventOptions
onNsewResizePointerDown targetId =
  Decoder.map (MsgOnNsewResizePointerDown >> andStopPropagation)
    (succeed OnPointerDownPortData
      |> hardcoded (idToAttribute targetId)
      |> required "pointerType" string
      |> required "clientX" float
      |> required "clientY" float)

applyMaxWidthChanged : Children -> OnMaxDimensionChangedData -> Children
applyMaxWidthChanged (Children nodes) data =
  let updater node = { node | maxWidth = data.value } in
  Children (TreeSpec.updateNodeById nodes data.targetId updater)

applyMaxHeightChanged : Children -> OnMaxDimensionChangedData -> Children
applyMaxHeightChanged (Children nodes) data =
  let updater node = { node | maxHeight = data.value } in
  Children (TreeSpec.updateNodeById nodes data.targetId updater)
