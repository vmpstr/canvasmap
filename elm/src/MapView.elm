module MapView exposing (ViewState, defaultViewState)

import Node exposing (NodeId)

type alias ViewState =
  { viewBeacons : Bool
  , dragId : Maybe NodeId
  , editId : Maybe NodeId
  , headBeaconPath : String
  , tailBeaconPath : String
  , shadow : Bool
  , htmlNodeId : String
  , selected : Maybe NodeId
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