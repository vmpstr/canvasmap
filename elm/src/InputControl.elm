port module InputControl exposing (subscriptions, Msg, update)

import Json.Decode as Decoder exposing (Decoder, string, succeed)
import Json.Decode.Pipeline exposing (required)
import Utils exposing (toMsgOrNoop)
import Browser.Events exposing (onKeyDown)
import MapModel exposing (State)
import NodeControl
import Node exposing (Children(..))
import EventUtils exposing (Key)
import AnnotationControl

type Msg
  = MsgNoop
  | MsgMapKeyDown Key
  | MsgNode NodeControl.Msg
  | MsgAnnotation AnnotationControl.Msg

subscriptions : () -> Sub Msg
subscriptions () =
  onKeyDownSubscription

wrapCmd : (msg -> Msg) -> (State, Children, Cmd msg) -> (State, Children, Cmd Msg)
wrapCmd wrapMsg (state, children, cmd) =
  (state, children, Cmd.map wrapMsg cmd)

update : Msg -> (State, Children) -> (State, Children, Cmd Msg)
update msg (state, children) =
  case msg of
    MsgNoop -> (state, children, Cmd.none)
    MsgMapKeyDown key -> processKey key state children
    MsgNode nodeMsg ->
      wrapCmd MsgNode (NodeControl.update nodeMsg (state, children))
    MsgAnnotation annotationMsg ->
      wrapCmd MsgAnnotation (AnnotationControl.update annotationMsg (state, children))

processKey : Key -> State -> Children -> (State, Children, Cmd Msg)
processKey key state children =
  if NodeControl.handlesKey key state then
    wrapCmd MsgNode (NodeControl.handleKey key state children)
  else if AnnotationControl.handlesKey key state then
    wrapCmd MsgAnnotation (AnnotationControl.handleKey key state children)
  else
    (state, children, Cmd.none)

port portOnKeyDown : (Decoder.Value -> msg) -> Sub msg

onKeyDownSubscription : Sub Msg
onKeyDownSubscription =
  portOnKeyDown
    (Decoder.decodeValue keyDecoder >> toMsgOrNoop MsgMapKeyDown MsgNoop)

-- TODO: Need to decode shift/ctrl/etc
keyDecoder : Decoder Key
keyDecoder =
  succeed Key
    |> required "code" string
