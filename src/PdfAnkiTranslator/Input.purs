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
import Data.NonEmpty (NonEmpty(..))
import Data.Set (Set)
import Data.Set as Set
import Foreign.Object (Object)
import Foreign.Object as Object
import Foreign.Object.ST (STObject)
import Foreign.Object.ST as STObject

type InputElement =
  { sentence               :: String
  , sentence_without_marks :: String
  , annotation_text_id     :: String
  , position               :: String
  , annotation_text        :: String
  , annotation_content     :: Maybe String
  }

decodeInputElement :: Json -> Either JsonDecodeError InputElement
decodeInputElement = decodeJson >=> \(obj :: Object Json) -> ado
  sentence               <- obj .: "sentence"
  sentence_without_marks <- obj .: "sentence_without_marks"
  position               <- obj .: "position"
  annotation_text_id     <- obj .: "annotation_text_id"
  annotation_text        <- obj .: "annotation_text"
  annotation_content     <- obj .:? "annotation_content"

  in
  { sentence
  , sentence_without_marks
  , position
  , annotation_text_id
  , annotation_text
  , annotation_content
  }

type Sentence =
  { sentence               :: String
  , sentence_without_marks :: String
  , position               :: String
  , annotation_content     :: Maybe String
  }

type UniqInputElementValue =
  { sentences :: NonEmptyArray Sentence
  , annotation_text :: String
  }

decodeInput :: Json -> Either JsonDecodeError (Object UniqInputElementValue)
decodeInput json = Decoders.decodeNonEmptyArray decodeInputElement json
  <#> \(inputs :: NonEmptyArray InputElement) ->
     Object.fromFoldableWith
     (\a1 a2 ->
       { sentences: a2.sentences <> a1.sentences
       , annotation_text: a1.annotation_text
       }
     )
     (inputs <#> \x -> Tuple x.annotation_text_id
        { sentences: NonEmptyArray.singleton
          { sentence: x.sentence
          , sentence_without_marks: x.sentence_without_marks
          , position: x.position
          , annotation_content: x.annotation_content
          }
        , annotation_text: x.annotation_text
        }
     )
