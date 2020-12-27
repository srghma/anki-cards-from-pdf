module PdfAnkiTranslator.CsvStringify where

import Effect.Uncurried
import Protolude

import Data.Nullable (Nullable)
import Data.Nullable as Nullable
import Effect.Aff.Compat (EffectFnAff(..), fromEffectFnAff)

type Input = Array (Array String)

foreign import _stringify :: Input -> EffectFnAff String

stringify :: Input -> Aff String
stringify input = fromEffectFnAff (_stringify input)
