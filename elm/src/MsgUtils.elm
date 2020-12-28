module MsgUtils exposing (..)

type alias MsgWithEventOptions a =
  { message: a
  , stopPropagation: Bool
  , preventDefault: Bool
  }

andStopPropagation : msg -> MsgWithEventOptions msg
andStopPropagation msg =
  { message = msg
  , stopPropagation = True
  , preventDefault = False
  }

