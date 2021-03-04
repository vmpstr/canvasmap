module Component.Slots where

import App.Prelude
import Halogen as H

data LabelEditorQuery a = SetLabel String a
data LabelEditorMessage = NewLabel String

type Slots =
  ( labelEditor :: H.Slot LabelEditorQuery LabelEditorMessage Int )

_labelEditor :: SProxy "labelEditor"
_labelEditor = SProxy 

