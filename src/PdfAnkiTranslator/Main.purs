module PdfAnkiTranslator.Main where

import Data.Argonaut.Decode
import Data.Exists
import Foreign
import PdfAnkiTranslator.Languages
import PdfAnkiTranslator.Lingolive.Types
import Protolude

import Affjax as Affjax
import Affjax.ResponseFormat as Affjax.ResponseFormat
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Array as Array
import Data.Array.NonEmpty (NonEmptyArray)
import Data.Array.NonEmpty as NonEmptyArray
import Data.Codec.Argonaut as Data.Codec.Argonaut
import Data.Foldable (oneOfMap)
import Data.Map (Map)
import Data.Map as Map
import Data.Set (Set)
import Data.Set as Set
import Data.String (Pattern(..))
import Data.String as String
import Data.Traversable (for)
import Data.TraversableWithIndex (forWithIndex)
import Effect.Class.Console (log)
import Node.Encoding (Encoding(..))
import Node.FS.Aff as Node.FS.Aff
import Options.Applicative as Options.Applicative
import PdfAnkiTranslator.AffjaxCache as PdfAnkiTranslator.AffjaxCache
import PdfAnkiTranslator.Cambridge.Transcription as PdfAnkiTranslator.Cambridge.Transcription
import PdfAnkiTranslator.Config as PdfAnkiTranslator.Config
import PdfAnkiTranslator.CsvStringify as PdfAnkiTranslator.CsvStringify
import PdfAnkiTranslator.GoogleTranslate.Translate as PdfAnkiTranslator.GoogleTranslate.Translate
import PdfAnkiTranslator.Input (InputElement, UniqInputElementValue)
import PdfAnkiTranslator.Input as PdfAnkiTranslator.Input
import PdfAnkiTranslator.Lingolive.Actions.Authenticate as PdfAnkiTranslator.Lingolive.Actions.Authenticate
import PdfAnkiTranslator.Lingolive.Actions.Translation as PdfAnkiTranslator.Lingolive.Actions.Translation
import PdfAnkiTranslator.Print as PdfAnkiTranslator.Print
import PdfAnkiTranslator.ReadStdin as PdfAnkiTranslator.ReadStdin

-- ./extract_notes.sh | spago run --main PdfAnkiTranslator.Main --node-args '--cache ./mycache.json'

wordVariants :: NonEmptyArray ArticleModel -> NonEmptyArray String
wordVariants = NonEmptyArray.nub <<< map
  ( String.toLower
  <<< strip String.stripSuffix
  <<< strip String.stripPrefix
  <<< \(ArticleModel articleModel) -> articleModel."Title"
  )
  where
    strip f x = f (Pattern "*") x # fromMaybe x

main :: Effect Unit
main = do
  config <- Options.Applicative.execParser PdfAnkiTranslator.Config.opts

  launchAff_ do
    inputJsonString <- PdfAnkiTranslator.ReadStdin.readStdin
      >>= maybe (throwError $ error "Expected stdin") pure

    (input :: Map String UniqInputElementValue) <- parseJson inputJsonString
      >>= PdfAnkiTranslator.Input.decodeInput
      # either (throwError <<< error <<< printJsonDecodeError) pure

    -- | traceM input

    abbyyAccessKey <- PdfAnkiTranslator.Lingolive.Actions.Authenticate.authenticate { apiKey: config.abbyy_api_key }
      >>= either (throwError <<< error <<< PdfAnkiTranslator.Lingolive.Actions.Authenticate.printError) pure

    -- | traceM abbyyAccessKey

    PdfAnkiTranslator.AffjaxCache.withCache config.cache \cache -> do
      (mapRendered :: Map String PdfAnkiTranslator.Print.AnkiFields) <- forWithIndex input \annotation_text_id inputElement -> do
          (fromAbbyy :: NonEmptyArray ArticleModel) <-
            PdfAnkiTranslator.Lingolive.Actions.Translation.translation
            { accessKey: abbyyAccessKey
            , requestFn: \affjaxRequest -> PdfAnkiTranslator.AffjaxCache.requestWithCache { cache, affjaxRequest, bodyCodec: Data.Codec.Argonaut.json }
            }
            { text: inputElement.annotation_text
            , srcLang: German
            , dstLang: Russian
            }
            >>= either (throwError <<< error <<< PdfAnkiTranslator.Lingolive.Actions.Translation.printError inputElement.annotation_text) pure

          let (wordVariants :: NonEmptyArray String) = wordVariants fromAbbyy

          traceM { fromAbbyy, wordVariants }

          (fromGoogleTranslate :: NonEmptyArray String) <-
            PdfAnkiTranslator.GoogleTranslate.Translate.request
            { accessKey: config.google_translate_access_key
            , requestFn: \affjaxRequest -> PdfAnkiTranslator.AffjaxCache.requestWithCache { cache, affjaxRequest, bodyCodec: Data.Codec.Argonaut.json }
            }
            { q: inputElement.annotation_text
            , source: German
            , target: Russian
            }
            >>= either (throwError <<< error <<< PdfAnkiTranslator.GoogleTranslate.Translate.printError inputElement.annotation_text) pure

          traceM { fromGoogleTranslate }

          (fromCambridgeTranscription :: Maybe String) <-
            oneOfMap
            ( \wordVariant ->
              PdfAnkiTranslator.Cambridge.Transcription.transcription
              { requestFn: \affjaxRequest -> PdfAnkiTranslator.AffjaxCache.requestWithCache { cache, affjaxRequest, bodyCodec: Data.Codec.Argonaut.string }
              }
              { text: wordVariant
              , srcLang: German
              , dstLang: Russian
              }
              >>= either (throwError <<< error <<< PdfAnkiTranslator.Cambridge.Transcription.printError wordVariant) pure
            )
            wordVariants

          traceM { fromCambridgeTranscription }

          -- | _ <- throwError $ error $ "No translations found for " <> show wordVariants

          let renderedWord = PdfAnkiTranslator.Print.printArticleModel
                { fromAbbyy
                , fromGoogleTranslate
                , fromCambridgeTranscription
                , sentences:           inputElement.sentences
                , annotation_text:     inputElement.annotation_text
                , annotation_text_id
                }

          pure renderedWord

      let (rendered :: Array PdfAnkiTranslator.Print.AnkiFields) = Array.fromFoldable mapRendered

      traceM rendered

      let
        print :: PdfAnkiTranslator.Print.AnkiFields -> Array String
        print x = [x.id, x.question, x.answer, x.transcription, x.myContext, x.body]

      csv <- PdfAnkiTranslator.CsvStringify.stringify $ map print rendered

      -- | traceM csv

      -- | log csv
      Node.FS.Aff.writeTextFile UTF8 "./output.csv" csv
