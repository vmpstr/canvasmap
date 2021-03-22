module App.Events.Node where

import App.Prelude
import App.Control.NodeAction as NA
import App.Control.DragAction as DA
import App.Data.NodeCommon (NodeId)

import Web.UIEvent.MouseEvent (MouseEvent, toEvent)

import Halogen.HTML.Properties as HP
import Halogen.HTML.Events as HE

selectHandler :: forall w r. (NA.Action -> w) -> Maybe NodeId -> HP.IProp (onClick :: MouseEvent | r) w
selectHandler wrap selection =
  HE.onClick
    \mouseEvent ->
      let event = toEvent mouseEvent
          selectAction = NA.Select selection
      in
      Just $ wrap $ NA.StopPropagation event selectAction

editLabelHandler :: forall w r. (NA.Action -> w) -> NodeId -> HP.IProp (onDoubleClick :: MouseEvent | r) w
editLabelHandler wrap id =
  HE.onDoubleClick
    \mouseEvent ->
      let event = toEvent mouseEvent
          selectAction = NA.EditLabel $ id
      in
      Just $ wrap $ NA.StopPropagation event selectAction

dragStartHandler :: forall w r. (DA.Action -> w) -> NodeId -> HP.IProp (onMouseDown :: MouseEvent | r) w
dragStartHandler wrap id =
  HE.onMouseDown
    \mouseEvent ->
      let event = toEvent mouseEvent
          mouseDownAction = DA.MouseDown mouseEvent id
      in
      Just $ wrap $ DA.StopPropagation event mouseDownAction
