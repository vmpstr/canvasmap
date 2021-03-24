module App.Events.Map where

import App.Prelude
import App.Control.DragAction as DA

import Web.UIEvent.MouseEvent (MouseEvent, toEvent)

import Halogen.HTML.Properties as HP
import Halogen.HTML.Events as HE

dragStopHandler :: forall w r. (DA.Action -> w) -> HP.IProp (onMouseUp :: MouseEvent | r) w
dragStopHandler wrap =
  HE.onMouseUp
    \mouseEvent ->
      let event = toEvent mouseEvent
          mouseUpAction = DA.MouseUp mouseEvent
      in
      Just $ wrap $ DA.StopPropagation event mouseUpAction

dragMoveHandler :: forall w r. (DA.Action -> w) -> HP.IProp (onMouseMove :: MouseEvent | r) w
dragMoveHandler wrap =
  HE.onMouseMove
    \mouseEvent ->
      let event = toEvent mouseEvent
          mouseMoveAction = DA.MouseMove mouseEvent
      in
      Just $ wrap $ DA.StopPropagation event mouseMoveAction
