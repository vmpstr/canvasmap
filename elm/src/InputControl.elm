port module InputControl exposing (subscriptions, Msg, update)

import Json.Decode as Decoder exposing (Decoder, string, succeed)
import Json.Decode.Pipeline exposing (required)
import Utils exposing (toMsgOrNoop)
import Browser.Events exposing (onKeyDown)
import MapModel exposing (State)
import NodeControl
import Node exposing (Children(..))

type Msg
  = MsgNoop
  | MsgMapKeyDown Key
  | MsgNode NodeControl.Msg

subscriptions : () -> Sub Msg
subscriptions () =
  onKeyDownSubscription

update : Msg -> (State, Children) -> (State, Children, Cmd Msg)
update msg (state, children) =
  case msg of
    MsgNoop -> (state, children, Cmd.none)
    MsgMapKeyDown key -> processKey key state children
    MsgNode nodeMsg ->
      let 
        (newState, newChildren, cmd) =
          NodeControl.update nodeMsg (state, children)
      in
      (newState, newChildren, Cmd.map MsgNode cmd)

processKey : Key -> State -> Children -> (State, Children, Cmd Msg)
processKey key state children =
  let
    (newState, newChildren, cmd) =
      if NodeControl.handlesKey key.code state then
        NodeControl.handleKey key.code state children
      else
        (state, children, Cmd.none)
  in
  (newState, newChildren, Cmd.map MsgNode cmd)

port portOnKeyDown : (Decoder.Value -> msg) -> Sub msg

onKeyDownSubscription : Sub Msg
onKeyDownSubscription =
  portOnKeyDown
    (Decoder.decodeValue keyDecoder >> toMsgOrNoop MsgMapKeyDown MsgNoop)

type alias Key =
  { code : String }

keyDecoder : Decoder Key
keyDecoder =
  succeed Key
    |> required "code" string
