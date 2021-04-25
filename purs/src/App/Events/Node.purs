module App.Events.Node where

import App.Prelude
import App.Control.NodeAction as NA
import App.Control.DragAction as DA
import App.Control.ResizeAction as RA
import App.Data.CSSClasses as CC
import App.Data.NodeCommon (NodeId)
import Component.LabelEditor as LabelEditor
import Component.Slots as Slots

import Web.UIEvent.MouseEvent (MouseEvent, toEvent)

import Halogen.HTML.Properties as HP
import Halogen.HTML.Events as HE
import Halogen.HTML as HH
import Halogen as H

-- Handlers
selectHandler :: forall w r. (NA.Action -> w) -> Maybe NodeId -> HP.IProp (onClick :: MouseEvent | r) w
selectHandler wrap selection =
  HE.onClick
    \mouseEvent ->
      let event = toEvent mouseEvent
          selectAction = NA.Select selection
      in
      wrap $ NA.StopPropagation event selectAction

editLabelHandler :: forall w r. (NA.Action -> w) -> NodeId -> HP.IProp (onDoubleClick :: MouseEvent | r) w
editLabelHandler wrap id =
  HE.onDoubleClick
    \mouseEvent ->
      let event = toEvent mouseEvent
          selectAction = NA.EditLabel $ id
      in
      wrap $ NA.StopPropagation event selectAction

finishEditHandler :: forall w. (NA.Action -> w) -> NodeId -> LabelEditor.Output -> w
finishEditHandler wrap id output =
  wrap $ NA.FinishEdit id output

dragStartHandler :: forall w r. (DA.Action -> w) -> NodeId -> HP.IProp (onMouseDown :: MouseEvent | r) w
dragStartHandler wrap id =
  HE.onMouseDown
    \mouseEvent ->
      let event = toEvent mouseEvent
          mouseDownAction = DA.MouseDown mouseEvent id
      in
      wrap $ DA.StopPropagation event mouseDownAction

-- Objects
labelEditor ::
  forall a m.
  MonadAff m =>
   (NA.Action -> a)
  -> NodeId
  -> LabelEditor.Input
  -> HH.HTML (H.ComponentSlot Slots.Slots m a) a 
labelEditor wrap id input =
  let
    component = LabelEditor.mkComponent unit
    handler = finishEditHandler wrap id
  in
  HH.slot Slots._labelEditor id component input handler

ewResizer :: forall w s. (NA.Action -> w) -> NodeId -> HH.HTML s w
ewResizer wrap id =
  let wrap' = wrap <<< NA.ResizeAction in
  HH.div
    [ HP.class_ CC.ew_resizer
    , HE.onMouseDown
        \mouseEvent ->
          let event = toEvent mouseEvent
              mouseDownAction = RA.EWStart mouseEvent id
          in
          wrap' $ RA.StopPropagation event mouseDownAction
    ] []

nsResizer :: forall w s. (NA.Action -> w) -> NodeId -> HH.HTML s w
nsResizer wrap id =
  let wrap' = wrap <<< NA.ResizeAction in
  HH.div
    [ HP.class_ CC.ns_resizer
    , HE.onMouseDown
        \mouseEvent ->
          let event = toEvent mouseEvent
              mouseDownAction = RA.NSStart mouseEvent id
          in
          wrap' $ RA.StopPropagation event mouseDownAction
    ] []