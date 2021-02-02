module App.Monad where

import Control.Monad.Reader.Trans (ReaderT, runReaderT)
import App.Environment (Environment)
import Effect.Aff (Aff)
import Data.Newtype (class Newtype, unwrap)

-- AppM monad: ReaderT pattern with environment and Aff base monad.
newtype AppM a = AppM (ReaderT Environment Aff a)

-- Instances:
derive instance appMNewtype :: Newtype (AppM a) _

-- Functionality.
runAppM :: forall a. AppM a -> Environment -> Aff a
runAppM m env = runReaderT (unwrap m) env