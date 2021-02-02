module Capabilities.Logging where

import Data.Unit (Unit)
import Control.Monad (class Monad)

data LogLevel
  = Debug
  | Info
  | Warning
  | Error

class Monad m <= Logger m where
  log :: LogLevel -> String -> m Unit