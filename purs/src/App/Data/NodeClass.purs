module App.Data.NodeClass where

import App.Prelude
import App.Data.Map.Action as MA
import App.Data.NodeCommon (NodeId)
import App.Data.Map.ViewState (ViewState)

import Component.Slots as Slots

import Halogen.HTML as HH

class LayoutNode n where
  render ::
    forall m a.
    MonadAff m =>
    (MA.Action -> a)
    -> (ViewState -> NodeId -> Array (HH.ComponentHTML a Slots.Slots m))
    -> ViewState
    -> n
    -> HH.ComponentHTML a Slots.Slots m
