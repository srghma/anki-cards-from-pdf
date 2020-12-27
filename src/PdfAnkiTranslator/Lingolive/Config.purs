module PdfAnkiTranslator.Lingolive.Config where

import PdfAnkiTranslator.Languages

-- https://developers.lingvolive.com/ru-ru/Dictionaries/De-Ru
languageToLanguageId =
  case _ of
       Russian -> 1049
       German -> 1031

serviceUrl = "https://developers.lingvolive.com"
