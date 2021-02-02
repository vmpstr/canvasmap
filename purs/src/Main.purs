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
  body <- HA.awaitBody

  let
    environment = mkEnvironment unit
    component = CMap.mkComponent unit
    component' = H.hoist (flip runAppM environment) component
  runUI component' unit body