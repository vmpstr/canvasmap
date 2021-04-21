module Component.Slots where

import App.Prelude
import Halogen as H
import App.Data.NodeCommon (NodeId)

import Component.LabelEditor as LabelEditor

type Slots =
  ( labelEditor :: forall query. H.Slot query LabelEditor.Input NodeId )

_labelEditor = Proxy :: Proxy "labelEditor"

 