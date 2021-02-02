module App.Environment where

import App.Logging as Log
import Data.Unit (Unit)

type Environment =
  { logLevel :: Log.LogLevel
  }

mkEnvironment :: Unit -> Environment
mkEnvironment _ =
  {  logLevel: Log.Debug
  }