module Main where

import App.Environment (mkEnvironment)
import App.Monad (runAppM)
import Component.Map as CMap

import Data.Unit (unit, Unit)
import Control.Bind (bind)
import Data.Function (flip)
import Effect (Effect)

import Halogen as H
import Halogen.Aff as HA
import Halogen.VDom.Driver (runUI)

main :: Effect Unit
main = HA.runHalogenAff do
  -- Wait for `body` element to be available.
  body <- HA.awaitBody

  let
    -- Make a default environment.
    -- TODO(vmpstr): We should read this from some config probably.
    environment = mkEnvironment unit

    -- Make a map component
    -- TODO(vmpstr): Eventually this needs to be a full app with routing.
    component = CMap.mkComponent unit

    -- Hoist the component from AppM to Aff using runAppM as a transformation.
    component' = H.hoist (flip runAppM environment) component

  -- Run the Halogen VDOM!
  runUI component' unit body