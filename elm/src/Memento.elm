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
import MapModel exposing (Model)
import Json.Decode as Decoder
import Utils exposing (toMsgOrNoop)

port portSaveState : Encode.Value -> Cmd msg
port portLoadState : () -> Cmd msg

loadLatestState : () -> Cmd msg
loadLatestState = portLoadState

force : (msg -> Model -> (Model, Cmd msg)) -> msg -> Model -> (Model, Cmd msg)
force updater msg model =
  let
    (newModel, cmd) = updater msg model
    saveCmd = encodeNodes newModel.nodes |> portSaveState
  in
  (newModel, [cmd, saveCmd] |> Cmd.batch)

intercept : (msg -> Model -> (Model, Cmd msg)) -> msg -> Model -> (Model, Cmd msg)
intercept updater msg model =
  let
    (newModel, cmd) = updater msg model
    isDelete = False
    saveCmd =
      -- The reason we save isDelete is that there is no action change
      -- when this happens. Create, for example, comes with an automatic
      -- label edit which causes a state change.
      -- TODO: Make this more elegant somehow (remove not isdelete?)
      if (not isDelete) && model.state.action == newModel.state.action then
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