module App.Data.NodeClass where

import App.Prelude
import App.Data.Map.Action as MapAction
import App.Data.NodeCommon (NodeId)
import App.Data.Map.ViewState (ViewState)

import Component.Slots as Slots

import Halogen.HTML as HH

class LayoutNode n where
  render ::
    forall m.
    MonadAff m =>
    (ViewState -> NodeId -> Array (HH.ComponentHTML MapAction.Action Slots.Slots m))
    -> ViewState
    -> n
    -> HH.ComponentHTML MapAction.Action Slots.Slots m
