module App.Events.Node where

import App.Prelude
import App.Control.NodeAction (Action(..))
import App.Data.NodeCommon (NodeId)

import Web.UIEvent.MouseEvent (MouseEvent, toEvent)

import Halogen.HTML.Properties as HP
import Halogen.HTML.Events as HE

selectHandler :: forall w r. (Action -> w) -> Maybe NodeId -> HP.IProp (onClick :: MouseEvent | r) w
selectHandler wrap selection =
  HE.onClick
    \mouseEvent ->
      let event = toEvent mouseEvent
          selectAction = Select selection
      in
      Just $ wrap $ StopPropagation event selectAction

editLabelHandler :: forall w r. (Action -> w) -> NodeId -> HP.IProp (onDoubleClick :: MouseEvent | r) w
editLabelHandler wrap id =
  HE.onDoubleClick
    \mouseEvent ->
      let event = toEvent mouseEvent
          selectAction = EditLabel $ id
      in
      Just $ wrap $ StopPropagation event selectAction
