module EventDecoders exposing (..)

import Json.Decode as Decoder exposing (Decoder, succeed, string, float, field, bool, fail, nullable)
import Json.Decode.Pipeline exposing (required, hardcoded, optional)

import EventDecodersData exposing (..)
import MapMsg exposing (..)
import Node exposing (Node, NodeType(..), Id, idToAttribute, Children(..))
import Geometry
import Tree
import TreeSpec
import Node exposing (idDecoder)

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

type alias FlatNode =
  { id : Int
  , label : String
  , x : Float
  , y : Float
  , width : Float
  , height : Float
  , childEdgeHeight : Float
  , children : Children
  , shift : Bool
  , maxWidth : Maybe Float
  , maxHeight : Maybe Float
  }

newNodeOffset : Geometry.Vector
newNodeOffset =
  { x = -40.0
  , y = -20.0
  }

flatNodeToNode : FlatNode -> Node
flatNodeToNode f =
  let
    nodeType = if f.shift then NodeTypeScroller else NodeTypeTree
  in
  { id = f.id
  , label = f.label
  , position = Geometry.add (Geometry.Vector f.x f.y) newNodeOffset
  , size = Geometry.Vector f.width f.height
  , childEdgeHeight = f.childEdgeHeight
  , children = f.children
  , nodeType = nodeType
  , maxWidth = f.maxWidth
  , maxHeight = f.maxHeight
  }

onAddNewNodeClickDecoder : Children -> Decoder MsgWithEventOptions
onAddNewNodeClickDecoder children =
  -- TODO: document the fields
  Decoder.map (MsgNewNode (Tree.AtIndex 0) >> andStopPropagation)
    (Decoder.map flatNodeToNode
      (succeed FlatNode
        |> hardcoded ((TreeSpec.findMaxId children) + 1)
        |> hardcoded "new item"
        |> required "clientX" float
        |> required "clientY" float
        |> hardcoded 0.0
        |> hardcoded 0.0
        |> hardcoded 0.0
        |> hardcoded (Children [])
        |> required "shiftKey" bool
        |> hardcoded Nothing
        |> hardcoded Nothing))
    
onMaxDimensionChangedDataDecoder : Decoder OnMaxDimensionChangedData
onMaxDimensionChangedDataDecoder =
  succeed OnMaxDimensionChangedData
    |> required "targetId" idDecoder
    |> optional "value" (nullable float) Nothing