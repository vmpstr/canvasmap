module EventDecodersData exposing (..)

import Node exposing (Id)

type alias OnPointerDownPortData =
  { targetId : String
  , pointerType : String
  , x : Float
  , y : Float
  }

type alias OnLabelChangedData =
  { targetId : Id
  , label : String
  }

type alias OnChildEdgeHeightChangedData =
  { targetId : Id
  , height: Float
  }

type alias Key =
  { code : String }

type alias OnMaxDimensionChangedData =
  { targetId : Id
  , value: Maybe Float
  }