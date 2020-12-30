module EventDecodersData exposing (..)

import Node exposing (Id)

type alias OnPointerDownPortData =
  { targetId : String
  , pointerType : String
  , x : Float
  , y : Float
  }

type alias OnChildEdgeHeightChangedData =
  { targetId : Id
  , height: Float
  }

