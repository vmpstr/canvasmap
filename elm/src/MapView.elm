module MapView exposing (ViewState, defaultViewState)

import Node exposing (Id)

type alias ViewState =
  { viewBeacons : Bool
  , dragId : Maybe Id
  , headBeaconPath : String
  , tailBeaconPath : String
  , shadow : Bool
  , htmlNodeId : String
  }

defaultViewState : ViewState
defaultViewState =
  { viewBeacons = False
  , dragId = Nothing
  , headBeaconPath = ""
  , tailBeaconPath = ""
  , shadow = False
  , htmlNodeId = ""
  }