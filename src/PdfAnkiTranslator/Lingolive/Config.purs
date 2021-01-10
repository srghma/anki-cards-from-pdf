module PdfAnkiTranslator.Lingolive.Config where

import PdfAnkiTranslator.Languages

import Effect.Exception.Unsafe (unsafeThrow)
import Protolude (undefined)

-- https://developers.lingvolive.com/ru-ru/Dictionaries/De-Ru
-- | languageToLanguageId :: Variant ( foo :: Int, bar :: Boolean, baz :: String )
languageToLanguageId =
  case _ of
       Russian -> 1049
       German -> 1031
       English -> 1033
       Japanese -> unsafeThrow "unknown"

serviceUrl = "https://developers.lingvolive.com"
