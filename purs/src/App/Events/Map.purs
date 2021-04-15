module App.Events.Map where

import App.Prelude
import App.Control.MapAction as MA
import App.Control.NodeAction as NA
import App.Control.DragAction as DA
import App.Control.MapMode as MM

import Web.UIEvent.MouseEvent (MouseEvent, toEvent)
import Web.UIEvent.MouseEvent as WME

import Halogen.HTML.Properties as HP
import Halogen.HTML.Events as HE

type MapEventsRow r =
  ( onMouseUp :: MouseEvent
  , onMouseMove :: MouseEvent
  , onClick :: MouseEvent
  , onDoubleClick :: MouseEvent
  | r)

mapActionsForMode :: forall w r. (MA.Action -> w) -> MM.Mode -> Array (HP.IProp (MapEventsRow r) w)
mapActionsForMode wrap mode
  | MM.isHookedToDrag mode =
    [ dragMoveHandler $ wrap <<< MA.DragAction
    , dragStopHandler $ wrap <<< MA.DragAction
    ]
  | otherwise =
    [ deselectHandler $ wrap <<< MA.NodeAction
    , newTopNodeHandler wrap
    ]

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

deselectHandler :: forall w r. (NA.Action -> w) -> HP.IProp (onClick :: MouseEvent | r) w
deselectHandler wrap =
  HE.onClick
    \mouseEvent ->
      let event = toEvent mouseEvent
          selectAction = NA.Select Nothing
      in
      Just $ wrap $ NA.StopPropagation event selectAction

newTopNodeHandler :: forall w r. (MA.Action -> w) -> HP.IProp (onDoubleClick :: MouseEvent | r) w
newTopNodeHandler wrap =
  HE.onDoubleClick
    \mouseEvent ->
      let
        newAction =
          MA.NewTopNode
            (WME.shiftKey mouseEvent)
            (WME.clientX mouseEvent)
            (WME.clientY mouseEvent)
      in
      Just $ wrap $ newAction