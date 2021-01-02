module EventUtils exposing (..)

type alias OnPointerDownPortData =
  { targetId : String
  , pointerType : String
  , x : Float
  , y : Float
  }

type alias Key =
  { code : String }
