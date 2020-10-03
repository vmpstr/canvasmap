module Node exposing (Children(..), Node, childList)

import Geometry exposing (Vector)

type Children = Children (List Node)

type alias Node =
  { id : String
  , position : Vector
  , size : Vector
  , childEdgeHeight: Float
  , children : Children
  }


childList : Children -> List Node
childList (Children nodes) =
  nodes

