module NodeUtils exposing (..)

import Geometry
import Json.Decode as Decoder exposing (Decoder, succeed, fail, string, float, nullable, bool, list)
import Json.Decode.Pipeline exposing (required, optional, hardcoded)
import Json.Encode as Encode
import Node exposing (..)
import TreeSpec

-- General helpers
attributePrefix : String
attributePrefix = "n"

idToAttribute : Id -> String
idToAttribute id =
  attributePrefix ++ String.fromInt id

idToShadowAttribute : Id -> String
idToShadowAttribute id =
  "shadow-" ++ idToAttribute id

-- New nodes
newNode : Children -> Node
newNode children =
  { id = (TreeSpec.findMaxId children) + 1
  , label = "new item"
  , position = Geometry.Vector 0 0
  , childEdgeHeight = 0
  , children = Children []
  , nodeType = NodeTypeTree
  , maxWidth = Nothing
  , maxHeight = Nothing
  , annotations = []
  }

-- Decoders
decodeId : String -> Decoder Id
decodeId str =
  if String.startsWith attributePrefix str then
    case String.dropLeft (String.length attributePrefix) str |> String.toInt of
       Just id ->
        succeed id
       Nothing ->
        fail ("Invalid id " ++ str)
  else
    fail ("Invalid id " ++ str)

idAttributeDecoder : Decoder Id
idAttributeDecoder =
  string |> Decoder.andThen decodeId

nodeTypeDecoder : Decoder NodeType
nodeTypeDecoder =
  let
    stringToNodeType s =
      if s == "tree" then
        succeed NodeTypeTree
      else if s == "scroller" then
        succeed NodeTypeScroller
      else
        fail ("Unknown node type " ++ s)
  in
  string |> Decoder.andThen stringToNodeType

annotationDecoder : Decoder Annotation
annotationDecoder =
  succeed Annotation
    |> required "url" string

nodeDecoder : Decoder Node
nodeDecoder =
  succeed Node
    |> required "id" Decoder.int
    |> required "label" Decoder.string
    |> required "position" Geometry.vectorDecoder
    |> hardcoded 0.0
    |> required "children" (Decoder.lazy (\() -> nodesDecoder))
    |> required "nodeType" nodeTypeDecoder
    |> optional "maxWidth" (nullable float) Nothing
    |> optional "maxHeight" (nullable float) Nothing
    |> optional "annotations" (list annotationDecoder) []

nodesDecoder : Decoder Children
nodesDecoder =
  Decoder.map Children (Decoder.list nodeDecoder)

newNodeOffset : Geometry.Vector
newNodeOffset =
  { x = -40.0
  , y = -20.0
  }

type alias FlatNode =
  { id : Int
  , label : String
  , x : Float
  , y : Float
  , childEdgeHeight : Float
  , children : Children
  , shift : Bool
  , maxWidth : Maybe Float
  , maxHeight : Maybe Float
  , annotations : List Annotation
  }

flatNodeToNode : FlatNode -> Node
flatNodeToNode f =
  let
    nodeType = if f.shift then NodeTypeScroller else NodeTypeTree
  in
  { id = f.id
  , label = f.label
  , position = Geometry.add (Geometry.Vector f.x f.y) newNodeOffset
  , childEdgeHeight = f.childEdgeHeight
  , children = f.children
  , nodeType = nodeType
  , maxWidth = f.maxWidth
  , maxHeight = f.maxHeight
  , annotations = f.annotations
  }

nodeFromClickDecoder : Children -> Decoder Node
nodeFromClickDecoder children =
    (Decoder.map flatNodeToNode
      (succeed FlatNode
        |> hardcoded ((TreeSpec.findMaxId children) + 1) -- id
        |> hardcoded "new item" -- label
        |> required "clientX" float -- x
        |> required "clientY" float -- y
        |> hardcoded 0.0 -- childEdgeHeight
        |> hardcoded (Children []) -- children
        |> required "shiftKey" bool -- shift
        |> hardcoded Nothing -- maxWidth
        |> hardcoded Nothing -- maxHeight
        |> hardcoded [])) -- annotations

-- Encoders
encodeId : Id -> Encode.Value
encodeId id =
  Encode.int id

encodeNodeType : NodeType -> Encode.Value
encodeNodeType nodeType =
  case nodeType of
    NodeTypeTree -> Encode.string "tree"
    NodeTypeScroller -> Encode.string "scroller"

dimensionToEncodeList : String -> Maybe Float -> List (String, Encode.Value)
dimensionToEncodeList name mvalue =
  case mvalue of
    Just value -> [(name, Encode.float value)]
    Nothing -> []

encodeAnnotation : Annotation -> Encode.Value
encodeAnnotation annotation =
  Encode.object
    ([ ("url", Encode.string annotation.url) ])

encodeNode : Node -> Encode.Value
encodeNode node =
  Encode.object
    ([ ("id", encodeId node.id)
    , ("label", Encode.string node.label)
    , ("position", Geometry.encodeVector node.position)
    , ("children", encodeNodes node.children)
    , ("nodeType", encodeNodeType node.nodeType)
    , ("annotations", Encode.list encodeAnnotation node.annotations)
    ] ++
    (dimensionToEncodeList "maxWidth" node.maxWidth) ++
    (dimensionToEncodeList "maxHeight" node.maxHeight))

encodeNodes : Children -> Encode.Value
encodeNodes (Children nodes) =
  Encode.list encodeNode nodes
