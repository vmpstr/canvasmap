module App.Data.NodeClass where

import App.Data.Map.Action as MapAction
import App.Data.NodeCommon (NodeId)
import App.Data.Map.ViewState (ViewState)

import Halogen.HTML as HH

class LayoutNode n where
  render ::
    forall slots
    .  (ViewState -> NodeId -> Array (HH.HTML slots MapAction.Action))
    -> ViewState
    -> n
    -> HH.HTML slots MapAction.Action
