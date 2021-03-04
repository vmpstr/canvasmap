module App.Data.NodeClass where

import App.Data.Map.Action as MapAction
import App.Data.NodeCommon (NodeId)
import App.Data.Map.ViewState (ViewState)

import Halogen.HTML as HH

class LayoutNode n where
  render ::
    forall slots m
    .  (ViewState -> NodeId -> Array (HH.ComponentHTML MapAction.Action slots m))
    -> ViewState
    -> n
    -> HH.ComponentHTML MapAction.Action slots m
