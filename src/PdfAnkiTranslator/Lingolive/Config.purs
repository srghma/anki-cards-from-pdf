module PdfAnkiTranslator.Lingolive.Config where

import PdfAnkiTranslator.Languages

import Protolude (undefined)

-- https://developers.lingvolive.com/ru-ru/Dictionaries/De-Ru
-- | languageToLanguageId :: Variant ( foo :: Int, bar :: Boolean, baz :: String )
languageToLanguageId =
  case _ of
       Russian -> 1049
       German -> 1031
       Japanese -> undefined

serviceUrl = "https://developers.lingvolive.com"
