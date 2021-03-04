module Capabilities.Debug where

import App.Prelude
import Effect.Unsafe (unsafePerformEffect)
import Effect.Class.Console (logShow)

log :: forall a. Show a => a -> a
log value =
  let _ = unsafePerformEffect $ logShow value in
  value