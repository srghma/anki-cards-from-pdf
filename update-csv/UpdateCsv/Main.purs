module UpdateCsv.Main where

import Data.Argonaut.Decode
import Data.Exists
import Effect.Aff.Retry
import Foreign
import PdfAnkiTranslator.Languages
import Protolude
import Record.CSV.Error
import Record.CSV.Parser
import Record.CSV.Printer

import Affjax as Affjax
import Affjax.ResponseFormat as Affjax.ResponseFormat
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Array as Array
import Data.Array.NonEmpty (NonEmptyArray)
import Data.Array.NonEmpty as NonEmptyArray
import Data.Codec.Argonaut as Data.Codec.Argonaut
import Data.Either as Either
import Data.Foldable (oneOfMap)
import Data.Lens (preview, set)
import Data.Lens.Index (ix)
import Data.List (List)
import Data.List as List
import Data.Map (Map)
import Data.Map as Map
import Data.Set (Set)
import Data.Set as Set
import Data.String (Pattern(..))
import Data.String as String
import Data.Time.Duration (Seconds(..), fromDuration, toDuration)
import Data.Traversable (for)
import Data.TraversableWithIndex (forWithIndex)
import Effect.Aff (delay)
import Effect.Class.Console (log)
import Foreign.Object (Object)
import Foreign.Object as Object
import Node.Encoding (Encoding(..))
import Node.FS.Aff as Node.FS.Aff
import Node.FS.Stream as Node.FS.Stream
import Node.Path (delimiter)
import Options.Applicative as Options.Applicative
import Data.String.Utils (startsWith)
import PdfAnkiTranslator.AffjaxCache as PdfAnkiTranslator.AffjaxCache
import PdfAnkiTranslator.Cambridge.Transcription as PdfAnkiTranslator.Cambridge.Transcription
import PdfAnkiTranslator.Config as PdfAnkiTranslator.Config
import PdfAnkiTranslator.CsvParse as CsvParse
import PdfAnkiTranslator.CsvStringify as PdfAnkiTranslator.CsvStringify
import PdfAnkiTranslator.GoogleTranslate.Translate as PdfAnkiTranslator.GoogleTranslate.Translate
import PdfAnkiTranslator.Input (InputElement, UniqInputElementValue)
import PdfAnkiTranslator.Input as PdfAnkiTranslator.Input
import PdfAnkiTranslator.Lingolive.Actions.Authenticate as PdfAnkiTranslator.Lingolive.Actions.Authenticate
import PdfAnkiTranslator.Lingolive.Actions.Minicard as PdfAnkiTranslator.Lingolive.Actions.Minicard
import PdfAnkiTranslator.Lingolive.MinicardResponseTypes as PdfAnkiTranslator.Lingolive.MinicardResponseTypes
import PdfAnkiTranslator.Print as PdfAnkiTranslator.Print
import PdfAnkiTranslator.ReadStdin as PdfAnkiTranslator.ReadStdin

type MyCsvRow =
  { "1" :: String
  , "2" :: String
  , "3" :: String
  , "keyword" :: String
  , "5" :: String
  , "6" :: String
  , "7" :: String
  , "8" :: String
  , "9" :: String
  , "10" :: String
  , "11" :: String
  , "12" :: String
  , "13" :: String
  , "14" :: String
  , "15" :: String
  , "16" :: String
  , "17" :: String
  , "18" :: String
  , "19" :: String
  , "20" :: String
  , "21" :: String
  , "22" :: String
  }

main :: Effect Unit
main = do
  config <- Options.Applicative.execParser PdfAnkiTranslator.Config.opts

  inputStream <- Node.FS.Stream.createReadStream "/home/srghma/Documents/All Kanji.csv"

  launchAff_ do
    (input :: Array (Array String)) <- CsvParse.parse { delimiter: "\t" } inputStream

    abbyyAccessKey <- PdfAnkiTranslator.Lingolive.Actions.Authenticate.authenticate { apiKey: config.abbyy_api_key }
      >>= either (throwError <<< error <<< PdfAnkiTranslator.Lingolive.Actions.Authenticate.printError) pure

    (output :: Array (Array String)) <-
      PdfAnkiTranslator.AffjaxCache.withCache config.cache \cache ->
        for input \inputElement -> do
          (elem :: String) <- preview (ix 3) inputElement
            # maybe (throwError $ error "no elem") pure

          retrying
            (fullJitterBackoff (Seconds 2.0))
            (\retryStatus x -> pure $ spy "is retry" $
              case spy "error" x of
                   Left (PdfAnkiTranslator.Lingolive.Actions.Minicard.Error__InvalidStatus status) -> startsWith "Too Many" status
                   _ ->  false
            )
            (\retryStatus ->
              PdfAnkiTranslator.Lingolive.Actions.Minicard.request
                { accessKey: abbyyAccessKey
                , requestFn: PdfAnkiTranslator.AffjaxCache.requestFnJson cache
                }
                { text: elem
                , srcLang: English
                , dstLang: Russian
                }
            )
            >>=
              case _ of
                   Left e -> do
                      traceM e

                      pure inputElement
                   Right transl -> do
                      let transl' = transl # unwrap # _."Translation" # unwrap # _."Translation"

                      traceM transl'

                      pure $ set (ix 3) (transl' <> "; " <> elem) inputElement

    x <- PdfAnkiTranslator.CsvStringify.stringify output

    Node.FS.Aff.writeTextFile UTF8 "./output.csv" x
