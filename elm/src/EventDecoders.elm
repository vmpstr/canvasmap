module EventDecoders exposing (..)

import Json.Decode as Decoder exposing (Decoder, succeed, string, float, field, bool, fail, nullable)
import Json.Decode.Pipeline exposing (required, hardcoded, optional)

import EventDecodersData exposing (..)
import MapMsg exposing (..)
import Node exposing (Node, NodeType(..), Id, Children(..))
import NodeUtils exposing (idToAttribute, idAttributeDecoder, nodeFromClickDecoder)
import Geometry
import Tree
import TreeSpec

andStopPropagation : Msg -> MsgWithEventOptions
andStopPropagation msg =
  { message = msg
  , stopPropagation = True
  , preventDefault = False
  }

onChildEdgeHeightChangedDecoder : Id -> Decoder Msg
onChildEdgeHeightChangedDecoder targetId =
  Decoder.map MsgOnChildEdgeHeightChanged
    (succeed OnChildEdgeHeightChangedData
      |> hardcoded targetId
      |> required "detail" (field "height" float))

onPointerDownDecoder : Id -> Decoder MsgWithEventOptions
onPointerDownDecoder targetId =
  Decoder.map (MsgOnPointerDown >> andStopPropagation)
    (succeed OnPointerDownPortData
      |> hardcoded (idToAttribute targetId)
      |> required "pointerType" string
      |> required "clientX" float
      |> required "clientY" float)

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

onLabelChangedDecoder : Id -> Decoder Msg
onLabelChangedDecoder targetId =
  Decoder.map MsgOnLabelChanged
    (succeed OnLabelChangedData
      |> hardcoded targetId
      |> required "detail" (field "label" string))

onSelectClickDecoder : Maybe Id -> Decoder MsgWithEventOptions
onSelectClickDecoder targetId =
  Decoder.map (MsgSelectNode >> andStopPropagation)
    (succeed targetId)

onEditLabelClickDecoder : Id -> Decoder MsgWithEventOptions
onEditLabelClickDecoder targetId =
  Decoder.map (MsgEditLabel >> andStopPropagation)
    (succeed targetId)

keyDecoder : Decoder Key
keyDecoder =
  succeed Key
    |> required "code" string

onAddNewNodeClickDecoder : Children -> Decoder MsgWithEventOptions
onAddNewNodeClickDecoder children =
  -- TODO: document the fields
  Decoder.map (MsgNewNode (Tree.AtIndex 0) >> andStopPropagation)
    (nodeFromClickDecoder children)
    
onMaxDimensionChangedDataDecoder : Decoder OnMaxDimensionChangedData
onMaxDimensionChangedDataDecoder =
  succeed OnMaxDimensionChangedData
    |> required "targetId" idAttributeDecoder
    |> optional "value" (nullable float) Nothing