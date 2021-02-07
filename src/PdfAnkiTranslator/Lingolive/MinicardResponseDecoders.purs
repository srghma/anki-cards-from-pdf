module PdfAnkiTranslator.Lingolive.MinicardResponseDecoders where

import Data.Argonaut.Decode
import PdfAnkiTranslator.Lingolive.DecodeUtils
import PdfAnkiTranslator.Lingolive.MinicardResponseTypes
import Protolude
import Affjax as Affjax
import Control.Monad.Except (withExceptT)
import Control.Monad.ST (ST)
import Control.Monad.ST as Control.Monad.ST
import Data.Argonaut.Core (Json)
import Data.Argonaut.Core as Json
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Argonaut.Decode.Generic (genericDecodeJson)
import Data.Array as Array
import Data.Show.Generic (genericShow)
import Foreign.Object (Object)
import Foreign.Object as Object
import Foreign.Object.ST (STObject)
import Foreign.Object.ST as STObject
import PdfAnkiTranslator.ArgonautCodecExtra
import Data.Array.NonEmpty (NonEmptyArray)
import Data.Array.NonEmpty as NonEmptyArray

decodeTranslation :: Json -> Either JsonDecodeError Translation
decodeTranslation =
  decodeJson
    >=> \(obj :: Object Json) -> ado
        translation <- obj .: "Translation"
        in Translation
          { "Translation": translation
          }

decodeResponse :: Json -> Either JsonDecodeError Response
decodeResponse =
  decodeJson
    >=> \(obj :: Object Json) -> ado
        translation <- obj .: "Translation" >>= decodeTranslation
        in Response
          { "Translation": translation
          }
