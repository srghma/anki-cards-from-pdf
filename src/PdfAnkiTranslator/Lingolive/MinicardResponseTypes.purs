module PdfAnkiTranslator.Lingolive.MinicardResponseTypes where

import Data.Argonaut.Decode
import Protolude
import Affjax as Affjax
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Argonaut.Decode.Generic (genericDecodeJson)
import Data.Show.Generic (genericShow)
import Foreign.Object (Object)

-- https://developers.lingvolive.com/ru-ru/Help/Api/GET-api-v1-Minicard_text_srcLang_dstLang

newtype Translation
  = Translation
  -- | { "Heading"        :: String
  { "Translation"    :: String
  -- | , "DictionaryName" :: String
  -- | , "SoundName"      :: String
  -- | , "Type"           :: Int
  -- | , "OriginalWord"   :: String
  }

derive instance genericTranslation :: Generic Translation _

instance showTranslation :: Show Translation where
  show x = genericShow x

derive instance eqTranslation :: Eq Translation

derive instance ordTranslation :: Ord Translation

derive instance newtypeTranslation :: Newtype Translation _

---------------------------

newtype Response
  = Response
  -- | { "SourceLanguage" :: String
  -- | , "TargetLanguage" :: String
  -- | , "Heading"        :: String
  { "Translation"    :: Translation
  -- | , "SeeAlso"        :: Array String
  }

derive instance genericResponse :: Generic Response _

instance showResponse :: Show Response where
  show x = genericShow x

derive instance eqResponse :: Eq Response

derive instance ordResponse :: Ord Response

derive instance newtypeResponse :: Newtype Response _
