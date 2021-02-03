module Capabilities.Logging where

import Data.Unit (Unit)
import Control.Monad (class Monad)
import Data.Monoid ((<>))
import Data.Eq (class Eq)
import Data.Ord (class Ord)

import Halogen (HalogenM, lift)

data LogLevel
  = Debug
  | Info
  | Warning
  | Error

derive instance logLevelEq :: Eq LogLevel
derive instance logLevelOrd :: Ord LogLevel

class Monad m <= Logger m where
  log :: LogLevel -> String -> m Unit

formatLog :: LogLevel -> String -> String
formatLog level s =
  case level of
    Debug   -> "[Debug] " <> s
    Info    -> "[Info ] " <> s
    Warning -> "[Warn ] " <> s
    Error   -> "[Error] " <> s


-- Logger to Halogen lift
instance halogenMLogger :: Logger m => Logger (HalogenM state action slots output m) where
  log l s = lift (log l s)