port module ResizeControl exposing
  ( Msg
  , subscriptions
  , update
  , ewResizer
  , nsResizer
  , nsewResizer
  , onChildEdgeHeightChangedAttribute
  )

import EventUtils exposing (OnPointerDownPortData)
import Html exposing (Html, div, Attribute)
import Html.Attributes exposing (class)
import Html.Events exposing (custom, on)
import Json.Decode as Decoder exposing (Decoder, succeed, nullable, float, string, field)
import Json.Decode.Pipeline exposing (required, optional, hardcoded)
import MsgUtils
import Node exposing (NodeId, Children(..))
import NodeUtils exposing (idAttributeDecoder, idToAttribute)
import TreeSpec
import UserAction
import Utils exposing (toMsgOrNoop)

type Msg
  = MsgNoop
  | MsgOnEwResizePointerDown OnPointerDownPortData
  | MsgOnNsResizePointerDown OnPointerDownPortData
  | MsgOnNsewResizePointerDown OnPointerDownPortData
  | MsgOnMaxWidthChanged OnMaxDimensionChangedData
  | MsgOnMaxHeightChanged OnMaxDimensionChangedData
  | MsgOnResizeEnd
  | MsgOnChildEdgeHeightChanged OnChildEdgeHeightChangedData

ewResizer : (Msg -> msg) -> NodeId -> Html msg 
ewResizer wrapMsg id =
  Html.map wrapMsg <|
    div
      [ class "ew_resizer"
      , custom "pointerdown" (onEwResizePointerDown id)
      ] []

nsResizer : (Msg -> msg) -> NodeId -> Html msg 
nsResizer wrapMsg id =
  Html.map wrapMsg <|
    div
      [ class "ns_resizer"
      , custom "pointerdown" (onNsResizePointerDown id)
      ] []

nsewResizer : (Msg -> msg) -> NodeId -> Html msg 
nsewResizer wrapMsg id =
  Html.map wrapMsg <|
    div
      [ class "nsew_resizer"
      , custom "pointerdown" (onNsewResizePointerDown id)
      ] []

onChildEdgeHeightChangedAttribute : (Msg -> msg) -> NodeId -> Attribute msg
onChildEdgeHeightChangedAttribute wrapMsg id =
  Html.Attributes.map wrapMsg <|
    on "childedgeheightchanged" (onChildEdgeHeightChangedDecoder id)


onMaxDimensionChangedDataDecoder : Decoder OnMaxDimensionChangedData
onMaxDimensionChangedDataDecoder =
  succeed OnMaxDimensionChangedData
    |> required "targetId" idAttributeDecoder
    |> optional "value" (nullable float) Nothing

port portOnMaxWidthChanged : (Decoder.Value -> msg) -> Sub msg
port portOnMaxHeightChanged : (Decoder.Value -> msg) -> Sub msg
port portOnResizeEnd : (Decoder.Value -> msg) -> Sub msg

onMaxWidthChangedSubscription : Sub Msg
onMaxWidthChangedSubscription =
  portOnMaxWidthChanged
    (Decoder.decodeValue onMaxDimensionChangedDataDecoder >> toMsgOrNoop MsgOnMaxWidthChanged MsgNoop)

onMaxHeightChangedSubscription : Sub Msg
onMaxHeightChangedSubscription =
  portOnMaxHeightChanged
    (Decoder.decodeValue onMaxDimensionChangedDataDecoder >> toMsgOrNoop MsgOnMaxHeightChanged MsgNoop)

onResizeEnd : Sub Msg
onResizeEnd =
  portOnResizeEnd (\_ -> MsgOnResizeEnd)

subscriptions : () -> Sub Msg
subscriptions () =
  [ onMaxWidthChangedSubscription
  , onMaxHeightChangedSubscription
  , onResizeEnd
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
      let
        (newState, cmd) = startResizeIfIdle appState (\() -> portOnEwResizePointerDown data)
      in
      (newState, nodes, cmd)

    MsgOnNsResizePointerDown data ->
      let
        (newState, cmd) = startResizeIfIdle appState (\() -> portOnNsResizePointerDown data)
      in
      (newState, nodes, cmd)

    MsgOnNsewResizePointerDown data ->
      let
        (newState, cmd) = startResizeIfIdle appState (\() -> portOnNsewResizePointerDown data)
      in
      (newState, nodes, cmd)

    MsgOnMaxWidthChanged data ->
      let newNodes = applyMaxWidthChanged appState nodes data in
      (appState, newNodes, Cmd.none)

    MsgOnMaxHeightChanged data ->
      let newNodes = applyMaxHeightChanged appState nodes data in
      (appState, newNodes, Cmd.none)

    MsgOnResizeEnd ->
      let newState = endResize appState in
      (newState, nodes, Cmd.none)

    MsgOnChildEdgeHeightChanged data ->
      let newNodes = applyChildEdgeHeightChange nodes data in
      (appState, newNodes, Cmd.none)


-- Internal
type alias AppState a =
  { a
  | action : UserAction.Action
  }

type alias OnMaxDimensionChangedData =
  { targetId : NodeId
  , value: Maybe Float
  }

onEwResizePointerDown : NodeId -> Decoder (MsgUtils.MsgWithEventOptions Msg)
onEwResizePointerDown targetId =
  Decoder.map (MsgOnEwResizePointerDown >> MsgUtils.andStopPropagation)
    (succeed OnPointerDownPortData
      |> hardcoded (idToAttribute targetId)
      |> required "pointerType" string
      |> required "clientX" float
      |> required "clientY" float)

onNsResizePointerDown : NodeId -> Decoder (MsgUtils.MsgWithEventOptions Msg)
onNsResizePointerDown targetId =
  Decoder.map (MsgOnNsResizePointerDown >> MsgUtils.andStopPropagation)
    (succeed OnPointerDownPortData
      |> hardcoded (idToAttribute targetId)
      |> required "pointerType" string
      |> required "clientX" float
      |> required "clientY" float)

onNsewResizePointerDown : NodeId -> Decoder (MsgUtils.MsgWithEventOptions Msg)
onNsewResizePointerDown targetId =
  Decoder.map (MsgOnNsewResizePointerDown >> MsgUtils.andStopPropagation)
    (succeed OnPointerDownPortData
      |> hardcoded (idToAttribute targetId)
      |> required "pointerType" string
      |> required "clientX" float
      |> required "clientY" float)

applyMaxWidthChanged : AppState a -> Children -> OnMaxDimensionChangedData -> Children
applyMaxWidthChanged appState (Children nodes) data =
  if appState.action == UserAction.Resizing then
    let updater node = { node | maxWidth = data.value } in
    Children (TreeSpec.updateNodeById nodes data.targetId updater)
  else
    (Children nodes)

applyMaxHeightChanged : AppState a -> Children -> OnMaxDimensionChangedData -> Children
applyMaxHeightChanged appState (Children nodes) data =
  if appState.action == UserAction.Resizing then
    let updater node = { node | maxHeight = data.value } in
    Children (TreeSpec.updateNodeById nodes data.targetId updater)
  else
    (Children nodes)

startResizeIfIdle : AppState a -> (() -> Cmd Msg) -> (AppState a, Cmd Msg)
startResizeIfIdle appState cmdGenerator =
  if UserAction.canPreempt UserAction.Resizing appState.action then
    ({ appState | action = UserAction.Resizing }, cmdGenerator ())
  else
    (appState, Cmd.none)

endResize : AppState a -> AppState a
endResize appState =
  if appState.action == UserAction.Resizing then
    { appState | action = UserAction.Idle }
  else
    appState

type alias OnChildEdgeHeightChangedData =
  { targetId : NodeId
  , height: Float
  }

applyChildEdgeHeightChange : Children -> OnChildEdgeHeightChangedData -> Children
applyChildEdgeHeightChange (Children nodes) { targetId, height } =
  let updater node = { node | childEdgeHeight = height } in
  case TreeSpec.findNode nodes targetId of
    Just path ->
      Children (TreeSpec.updateNode nodes path updater)
    Nothing ->
      Children nodes

onChildEdgeHeightChangedDecoder : NodeId -> Decoder Msg
onChildEdgeHeightChangedDecoder targetId =
  Decoder.map MsgOnChildEdgeHeightChanged
    (succeed OnChildEdgeHeightChangedData
      |> hardcoded targetId
      |> required "detail" (field "height" float))