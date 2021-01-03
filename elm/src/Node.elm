module Node exposing
  (Children(..)
  , childList
  , Id
  , Node
  , NodeType(..)
  , Annotation
  )

import Geometry exposing (Vector)

type Children = Children (List Node)

childList : Children -> List Node
childList (Children nodes) =
  nodes

type alias Id = Int

type NodeType
  = NodeTypeTree
  | NodeTypeScroller

type alias Annotation =
  { url : String
  }

type alias Node =
  { id : Id
  , label : String
  , position : Vector
  , childEdgeHeight: Float
  , children : Children
  , nodeType : NodeType
  , maxWidth : Maybe Float
  , maxHeight : Maybe Float
  , annotations : List Annotation
  }
