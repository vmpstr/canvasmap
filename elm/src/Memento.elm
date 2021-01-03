port module Memento exposing
  ( force
  , intercept
  , loadLatestState
  , Msg(..)
  , subscriptions
  , update
  )

import Json.Encode as Encode
import UserAction
import NodeUtils exposing (encodeNodes, nodesDecoder)
import Node exposing (Children(..))
import MapModel exposing (Model, State)
import Json.Decode as Decoder
import Utils exposing (toMsgOrNoop)

port portSaveState : Encode.Value -> Cmd msg
port portLoadState : () -> Cmd msg

loadLatestState : () -> Cmd msg
loadLatestState = portLoadState

force : (State, Children, Cmd msg) -> (State, Children, Cmd msg)
force (state, children, cmd) =
  let
    saveCmd = encodeNodes children |> portSaveState
  in
  (state, children, [cmd, saveCmd] |> Cmd.batch)

intercept : (msg -> Model -> (Model, Cmd msg)) -> msg -> Model -> (Model, Cmd msg)
intercept updater msg model =
  let
    (newModel, cmd) = updater msg model
    saveCmd =
      if model.state.action == newModel.state.action then
        Cmd.none
      else
        encodeNodes newModel.nodes |> portSaveState
  in
  (newModel, [cmd, saveCmd] |> Cmd.batch)

port portOnLoadState : (Decoder.Value -> msg) -> Sub msg

type Msg
  = MsgNoop
  | MsgSetNodes Children

onLoadStateSubscription : Sub Msg
onLoadStateSubscription =
  portOnLoadState
    (Decoder.decodeValue nodesDecoder >> toMsgOrNoop MsgSetNodes MsgNoop)

subscriptions : () -> Sub Msg
subscriptions () =
  onLoadStateSubscription

-- TODO: have a loading state so that we don't do anything before this.
update : Msg -> (state, Children) -> (state, Children, Cmd Msg)
update msg (state, nodes) =
  case msg of
    MsgNoop -> (state, nodes, Cmd.none)
    MsgSetNodes newNodes -> (state, newNodes, Cmd.none)