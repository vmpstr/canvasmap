module MMNode exposing (Children(..), Node, childList)

import MMGeometry exposing (Vector)

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

