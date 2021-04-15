module App.Control.Resize where

import App.Prelude
import App.Control.MapState (State)
import App.Control.ResizeAction (Action)
import App.Control.StateChangeType as SCT

handleAction :: forall m. MonadEffect m => Action -> State -> m (Tuple State SCT.Type)
handleAction action state =
  pure $ state /\ SCT.NoChange