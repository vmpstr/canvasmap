module EventDecoders exposing (..)

import EventDecodersData exposing (..)
import Geometry
import Json.Decode as Decoder exposing (Decoder, succeed, string, float, field, bool, fail, nullable)
import Json.Decode.Pipeline exposing (required, hardcoded, optional)
import MapMsg exposing (..)
import MsgUtils
import Node exposing (Node, NodeType(..), Id, Children(..))
import NodeUtils exposing (idToAttribute, idAttributeDecoder, nodeFromClickDecoder)
import Tree
import TreeSpec


onChildEdgeHeightChangedDecoder : Id -> Decoder Msg
onChildEdgeHeightChangedDecoder targetId =
  Decoder.map MsgOnChildEdgeHeightChanged
    (succeed OnChildEdgeHeightChangedData
      |> hardcoded targetId
      |> required "detail" (field "height" float))

onLabelChangedDecoder : Id -> Decoder Msg
onLabelChangedDecoder targetId =
  Decoder.map MsgOnLabelChanged
    (succeed OnLabelChangedData
      |> hardcoded targetId
      |> required "detail" (field "label" string))

onSelectClickDecoder : Maybe Id -> Decoder (MsgUtils.MsgWithEventOptions Msg)
onSelectClickDecoder targetId =
  Decoder.map (MsgSelectNode >> MsgUtils.andStopPropagation)
    (succeed targetId)

onEditLabelClickDecoder : Id -> Decoder (MsgUtils.MsgWithEventOptions Msg)
onEditLabelClickDecoder targetId =
  Decoder.map (MsgEditLabel >> MsgUtils.andStopPropagation)
    (succeed targetId)

keyDecoder : Decoder Key
keyDecoder =
  succeed Key
    |> required "code" string

onAddNewNodeClickDecoder : Children -> Decoder (MsgUtils.MsgWithEventOptions Msg)
onAddNewNodeClickDecoder children =
  -- TODO: document the fields
  Decoder.map (MsgNewNode (Tree.AtIndex 0) >> MsgUtils.andStopPropagation)
    (nodeFromClickDecoder children)
    