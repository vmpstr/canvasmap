module MapView exposing (ViewState, defaultViewState)

import Node exposing (Id)

type alias ViewState =
  { viewBeacons : Bool
  , dragId : Maybe Id
  , editId : Maybe Id
  , headBeaconPath : String
  , tailBeaconPath : String
  , shadow : Bool
  , htmlNodeId : String
  , selected : Maybe Id
  , showParentEdge : Bool
  }

defaultViewState : ViewState
defaultViewState =
  { viewBeacons = False
  , dragId = Nothing
  , editId = Nothing
  , headBeaconPath = ""
  , tailBeaconPath = ""
  , shadow = False
  , htmlNodeId = ""
  , selected = Nothing
  , showParentEdge = True
  }