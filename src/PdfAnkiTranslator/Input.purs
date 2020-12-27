module PdfAnkiTranslator.Input where

import Data.Argonaut.Decode
import PdfAnkiTranslator.Lingolive.DecodeUtils
import PdfAnkiTranslator.Lingolive.Types
import Protolude

import Affjax as Affjax
import Control.Monad.Except (withExceptT)
import Control.Monad.ST (ST)
import Control.Monad.ST as Control.Monad.ST
import Data.Argonaut.Core (Json)
import Data.Argonaut.Core as Json
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Argonaut.Decode.Generic.Rep (genericDecodeJson)
import Data.Array as Array
import Data.Array.NonEmpty (NonEmptyArray)
import Data.Array.NonEmpty as NonEmptyArray
import Data.Generic.Rep.Show (genericShow)
import Data.List.Unique as Data.List.Unique
import Data.Map (Map)
import Data.Map as Map
import Data.Set (Set)
import Data.Set as Set
import Foreign.Object (Object)
import Foreign.Object as Object
import Foreign.Object.ST (STObject)
import Foreign.Object.ST as STObject

type InputElement =
  { sentence           :: String
  , annotation_text_id :: String
  , position           :: String
  , annotation_text    :: String
  , annotation_content :: Maybe String
  }

decodeInputElement :: Json -> Either JsonDecodeError InputElement
decodeInputElement = decodeJson >=> \(obj :: Object Json) -> ado
  sentence           <- obj .: "sentence"
  position           <- obj .: "position"
  annotation_text_id <- obj .: "annotation_text_id"
  annotation_text    <- obj .: "annotation_text"
  annotation_content <- obj .:? "annotation_content"
  in
  { sentence
  , position
  , annotation_text_id
  , annotation_text
  , annotation_content
  }

type UniqInputElementValue =
  { sentences :: Array
    { sentence :: String
    , position :: String
    , annotation_content :: Maybe String
    }
  , annotation_text :: String
  }

decodeInput :: Json -> Either JsonDecodeError (Map String UniqInputElementValue)
decodeInput json = Decoders.decodeNonEmptyArray decodeInputElement json
  <#> \(inputs :: NonEmptyArray InputElement) ->
     Map.fromFoldableWith
     (\a1 a2 ->
       { sentences: a1.sentences <> a2.sentences
       , annotation_text: a1.annotation_text
       }
     )
     (inputs <#> \x -> Tuple x.annotation_text_id
        { sentences:
          [ { sentence: x.sentence
            , position: x.position
            , annotation_content: x.annotation_content
            }
          ]
        , annotation_text: x.annotation_text
        }
     )
