module App.Class.LayoutNode where

import App.Prelude
import App.Control.NodeAction as NA
import App.Data.NodeCommon (NodeId)
import App.View.ViewState (ViewState)

import Component.Slots as Slots

import Halogen.HTML as HH

class LayoutNode n where
  render ::
    forall m a.
    MonadAff m =>
    (NA.Action -> a)
    -> (ViewState -> NodeId -> Array (HH.ComponentHTML a Slots.Slots m))
    -> ViewState
    -> n
    -> HH.ComponentHTML a Slots.Slots m
