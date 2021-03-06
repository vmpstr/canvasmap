module App.Monad where

import App.Prelude
import App.Environment (Environment)
import Capabilities.Logging (class Logger, formatLog)

import Control.Monad.Reader.Trans (ReaderT, runReaderT)
import Control.Monad.Reader.Class (class MonadAsk, asks, ask)
import Effect.Aff (Aff)
import Effect.Aff.Class (class MonadAff)
import Data.Newtype (class Newtype, unwrap)
import Data.Functor (class Functor)
import Control.Apply (class Apply)
import Control.Applicative (class Applicative, when)
import Control.Bind (class Bind, bind)
import Control.Monad (class Monad)
import Effect.Class.Console as Console
import Effect.Class (class MonadEffect, liftEffect)
import Type.Equality as TE
import Control.Plus (class Plus)
import Control.Alternative (class Alternative)
import Control.Alt (class Alt)

-- AppM monad: ReaderT pattern with environment and Aff base monad.
newtype AppM a = AppM (ReaderT Environment Aff a)

-- Instances:
-- Newtype for wrap/unwrap
derive instance appMNewtype :: Newtype (AppM a) _
-- Monad + friends
derive newtype instance appMFunctor :: Functor AppM
derive newtype instance appMApply :: Apply AppM
derive newtype instance appMApplicative :: Applicative AppM
derive newtype instance appMBind :: Bind AppM
derive newtype instance appMMonad :: Monad AppM

derive newtype instance appMAlt :: Alt AppM
derive newtype instance appMPlus :: Plus AppM

instance appMAlternative :: Alternative AppM
instance appMMonadPlus :: MonadPlus AppM

-- MonadEffect
derive newtype instance appMMonadEffect :: MonadEffect AppM
derive newtype instance appMMonadAff :: MonadAff AppM

instance appMMonadAsk :: TE.TypeEquals e Environment => MonadAsk e AppM where
  ask = AppM (asks TE.from)

instance appMLogger :: Logger AppM where
  log level s = do
    env <- ask
    when (env.logLevel <= level) $
      formatLog level s
      # Console.log
      # liftEffect

-- Functionality.
runAppM :: forall a. AppM a -> Environment -> Aff a
runAppM m env = runReaderT (unwrap m) env
