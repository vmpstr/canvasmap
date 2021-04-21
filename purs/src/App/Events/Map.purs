module App.Events.Map where

import App.Prelude
import App.Control.MapAction as MA
import App.Control.NodeAction as NA
import App.Control.DragAction as DA
import App.Control.ResizeAction as RA
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
  | MM.isHookedToResize mode =
    [ resizeMoveHandler $ wrap <<< MA.ResizeAction
    , resizeStopHandler $ wrap <<< MA.ResizeAction
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
      wrap $ DA.StopPropagation event mouseUpAction

dragMoveHandler :: forall w r. (DA.Action -> w) -> HP.IProp (onMouseMove :: MouseEvent | r) w
dragMoveHandler wrap =
  HE.onMouseMove
    \mouseEvent ->
      let event = toEvent mouseEvent
          mouseMoveAction = DA.MouseMove mouseEvent
      in
      wrap $ DA.StopPropagation event mouseMoveAction

resizeStopHandler :: forall w r. (RA.Action -> w) -> HP.IProp (onMouseUp :: MouseEvent | r) w
resizeStopHandler wrap =
  HE.onMouseUp
    \mouseEvent ->
      let event = toEvent mouseEvent
          mouseUpAction = RA.MouseUp mouseEvent
      in
      wrap $ RA.StopPropagation event mouseUpAction

resizeMoveHandler :: forall w r. (RA.Action -> w) -> HP.IProp (onMouseMove :: MouseEvent | r) w
resizeMoveHandler wrap =
  HE.onMouseMove
    \mouseEvent ->
      let event = toEvent mouseEvent
          mouseMoveAction = RA.MouseMove mouseEvent
      in
      wrap $ RA.StopPropagation event mouseMoveAction

deselectHandler :: forall w r. (NA.Action -> w) -> HP.IProp (onClick :: MouseEvent | r) w
deselectHandler wrap =
  HE.onClick
    \mouseEvent ->
      let event = toEvent mouseEvent
          selectAction = NA.Select Nothing
      in
      wrap $ NA.StopPropagation event selectAction

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
      wrap $ newAction