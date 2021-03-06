port module NodeControl exposing
  ( Msg(..)
  , update
  , subscriptions
  , onSelectAttribute
  , onEditLabelAttribute
  , onLabelChangedAttribute
  , onDeselectAttribute
  , onAddNewNodeAttribute
  , handlesKey
  , handleKey
  )

import Node exposing (NodeId, Node, Children(..), childList)
import MapModel exposing (State)
import Tree
import NodeUtils exposing (idToAttribute, nodeFromClickDecoder)
import TreeSpec
import UserAction
import MsgUtils
import Json.Decode as Decoder exposing (Decoder, field, string, succeed)
import Json.Decode.Pipeline exposing (required, hardcoded)
import Html exposing (Attribute)
import Html.Attributes
import Html.Events exposing (custom, on)
import Memento
import EventUtils exposing (Key)
import Task
import Utils

type alias OnLabelChangedData =
  { targetId : NodeId
  , label : String
  }

type Msg
  = MsgNoop
  | MsgOnLabelChanged OnLabelChangedData
  | MsgEditLabel NodeId
  | MsgNewNode (Tree.Path, Node)
  | MsgSelectNode (Maybe NodeId)
  | MsgDeleteNode NodeId

onDeselectAttribute : (Msg -> msg) -> Attribute msg
onDeselectAttribute wrapMsg =
  Html.Attributes.map wrapMsg <|
    custom "click" (onSelectClickDecoder Nothing)

onSelectAttribute : (Msg -> msg) -> NodeId -> Attribute msg
onSelectAttribute wrapMsg id =
  Html.Attributes.map wrapMsg <|
    custom "click" (onSelectClickDecoder (Just id))

onEditLabelAttribute : (Msg -> msg) -> NodeId -> Attribute msg
onEditLabelAttribute wrapMsg id =
  Html.Attributes.map wrapMsg <|
    custom "dblclick" (onEditLabelClickDecoder id)

onLabelChangedAttribute : (Msg -> msg) -> NodeId -> Attribute msg
onLabelChangedAttribute wrapMsg id =
  Html.Attributes.map wrapMsg <|
    on "labelchanged" (onLabelChangedDecoder id)

onAddNewNodeAttribute : (Msg -> msg) -> Children -> Attribute msg
onAddNewNodeAttribute wrapMsg children =
  Html.Attributes.map wrapMsg <|
    custom "dblclick" (onAddNewNodeClickDecoder children)

port portEditLabel : { targetId : String } -> Cmd msg
port portNodeSelected : { targetId : String } -> Cmd msg

update : Msg -> (State, Children) -> (State, Children, Cmd Msg)
update msg (state, children) =
  case msg of
    MsgNoop ->
      (state, children, Cmd.none)

    MsgEditLabel nodeId ->
      let
          newState = applyEditLabelState state nodeId
          cmd = portEditLabel { targetId = idToAttribute nodeId }
      in
      (newState, children, cmd)

    MsgOnLabelChanged data ->
      let
          newChildren = applyLabelChange children data.targetId data.label
          newState = endEditLabelState state
      in
      (newState, newChildren, Cmd.none)

    MsgNewNode (path, node) ->
      let 
        insertedChildren = insertChild children path node
        (selectState, selectCmd) = selectNode state (Just node.id)
        (newState, newChildren, editCmd) =
          update
            (MsgEditLabel node.id)
            (selectState, insertedChildren)
      in
      (newState, newChildren, [ selectCmd, editCmd ] |> Cmd.batch)

    MsgSelectNode id ->
      let
        (newState, cmd) = selectNode state id
      in
      (newState, children, cmd)

    MsgDeleteNode id ->
      let
        (newState, cmd) =
          if state.selected == Just id then
            selectNode state Nothing
          else
            (state, Cmd.none)
        newChildren = removeChild children id
      in
      Memento.force (newState, newChildren, cmd)

handlesKey : Key -> State -> Bool
handlesKey key state =
  -- TODO: Compress this a bit into an unconditional statement
  if key.code == "Backspace" || key.code == "Delete" then
    True
  else if key.code == "Tab" && state.action == UserAction.Idle then
    True
  else if key.code == "Enter" && state.action == UserAction.Idle then
    True
  else
    False

handleKey : Key -> State -> Children -> (State, Children, Cmd Msg)
handleKey key state children =
  let
    cmd =
      if key.code == "Backspace" || key.code == "Delete" then
        case state.selected of
          Just id -> (MsgDeleteNode id) |> Utils.msgToCmd
          Nothing -> Cmd.none
      else if key.code == "Tab" && state.action == UserAction.Idle then
        case state.selected |> Maybe.andThen (pathToFirstChildOfId children) of
          Just path -> MsgNewNode (path, (NodeUtils.newNode children)) |> Utils.msgToCmd
          Nothing -> Cmd.none
      else if key.code == "Enter" && state.action == UserAction.Idle then
        case state.selected |> Maybe.andThen (pathToNextSiblingOfId children) of
          Just path -> MsgNewNode (path, (NodeUtils.newNode children)) |> Utils.msgToCmd
          Nothing -> Cmd.none
      else
        Cmd.none
  in
  (state, children, cmd)

pathToNextSiblingOfId : Children -> NodeId -> Maybe Tree.Path
pathToNextSiblingOfId (Children nodes) id =
  case TreeSpec.findNode nodes id of
    Just path ->
      -- Next sibling of top level item is its first child
      case path of
        Tree.AtIndex index -> pathToFirstChildOfId (Children nodes) id
        _ -> Just (Tree.incrementBase path)
    Nothing ->
      Nothing

pathToFirstChildOfId : Children -> NodeId -> Maybe Tree.Path
pathToFirstChildOfId (Children nodes) id =
  case TreeSpec.findNode nodes id of
    Just path ->
      Just (Tree.appendPath 0 (Just path))
    Nothing ->
      Nothing

selectNode : State -> Maybe NodeId -> (State, Cmd Msg)
selectNode state id =
  let
    cmd =
      if state.selected /= id then
        case id of 
          Just value -> portNodeSelected { targetId = idToAttribute value }
          Nothing -> Cmd.none
      else
        Cmd.none
  in
  ({ state | selected = id }, cmd)

insertChild : Children -> Tree.Path -> Node -> Children
insertChild (Children nodes) path node =
  Children (TreeSpec.addNode nodes path node)

removeChild : Children -> NodeId -> Children
removeChild (Children nodes) id =
  let
    mpath = TreeSpec.findNode nodes id
  in
  case mpath of
    Just path ->
      Children (TreeSpec.removeNode nodes path)
    Nothing ->
      Children nodes


applyLabelChange : Children -> NodeId -> String -> Children
applyLabelChange (Children nodes) targetId label =
  let updater node = { node | label = label } in
  case TreeSpec.findNode nodes targetId of
    Just path ->
      Children (TreeSpec.updateNode nodes path updater)
    Nothing ->
      Children nodes

endEditLabelState : State -> State
endEditLabelState state =
  { state | action = UserAction.Idle, drag = Nothing, editing = Nothing }

applyEditLabelState : State -> NodeId -> State
applyEditLabelState state id =
  { state | action = UserAction.Editing, drag = Nothing, editing = Just id }

subscriptions : () -> Sub Msg
subscriptions () = Sub.none

onLabelChangedDecoder : NodeId -> Decoder Msg
onLabelChangedDecoder targetId =
  Decoder.map MsgOnLabelChanged
    (succeed OnLabelChangedData
      |> hardcoded targetId
      |> required "detail" (field "label" string))

onSelectClickDecoder : Maybe NodeId -> Decoder (MsgUtils.MsgWithEventOptions Msg)
onSelectClickDecoder targetId =
  Decoder.map (MsgSelectNode >> MsgUtils.andStopPropagation)
    (succeed targetId)

onEditLabelClickDecoder : NodeId -> Decoder (MsgUtils.MsgWithEventOptions Msg)
onEditLabelClickDecoder targetId =
  Decoder.map (MsgEditLabel >> MsgUtils.andStopPropagation)
    (succeed targetId)

onAddNewNodeClickDecoder : Children -> Decoder (MsgUtils.MsgWithEventOptions Msg)
onAddNewNodeClickDecoder children =
  Decoder.map (Tuple.pair (Tree.AtIndex 0) >> MsgNewNode >> MsgUtils.andStopPropagation)
    (nodeFromClickDecoder children)
    