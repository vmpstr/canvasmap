module MapView exposing (ViewState, defaultViewState)

import Node exposing (Id)

type alias ViewState =
  { viewBeacons : Bool
  , dragId : Maybe Id
  }

defaultViewState : ViewState
defaultViewState =
  { viewBeacons = False
  , dragId = Nothing
  }