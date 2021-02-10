module KanshudoFind.Main where

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
import Data.Array (catMaybes, mapMaybe)
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
import Data.String.Regex as Regex
import Data.String.Regex.Flags as Regex
import Data.String.Regex.Unsafe as Regex
import Data.String.Utils (startsWith)
import Data.Time.Duration (Seconds(..), fromDuration, toDuration)
import Data.Traversable (for)
import Data.TraversableWithIndex (forWithIndex)
import Effect.Aff (delay)
import Effect.Class.Console (log)
import Foreign.Object (Object)
import Foreign.Object as Object
import KanshudoFind.Input as KanshudoFind.Input
import KanshudoFind.Kanshudo as KanshudoFind.Kanshudo
import Node.Encoding (Encoding(..))
import Node.FS.Aff as Node.FS.Aff
import Node.FS.Stream as Node.FS.Stream
import Node.Path (delimiter)
import Options.Applicative as Options.Applicative
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

main :: Effect Unit
main = do
  launchAff_ do
    (output :: Array (Maybe _)) <-
      PdfAnkiTranslator.AffjaxCache.withCache "./mycache.json" \cache ->
        for KanshudoFind.Input.input \(kanji :: String) -> do
          KanshudoFind.Kanshudo.transcription
            { requestFn: PdfAnkiTranslator.AffjaxCache.requestFnString cache
            }
            { text: kanji
            }
            >>=
              case _ of
                   Left e -> do
                      traceM e
                      pure Nothing
                   Right body -> do
                      let
                          (ideograph :: Maybe String) = do
                            matches <- Regex.match (Regex.unsafeRegex """<div><b>Ideograph<\/b>: (.+?)<\/div>""" Regex.noFlags) body
                            join $ NonEmptyArray.index matches 1

                          (pictographic :: Maybe String) = do
                            matches <- Regex.match (Regex.unsafeRegex """<div><b>Pictographic<\/b>: (.+?)<\/div>""" Regex.noFlags) body
                            join $ NonEmptyArray.index matches 1

                          (pictophonetic :: Maybe String) = do
                            matches <- Regex.match (Regex.unsafeRegex """<div><b>Pictophonetic<\/b>: (.+?)<\/div>""" Regex.noFlags) body
                            join $ NonEmptyArray.index matches 1

                          (en :: Maybe String) = do
                            matches <- Regex.match (Regex.unsafeRegex """<span class="en">(.+?)<\/span>""" Regex.noFlags) body
                            join $ NonEmptyArray.index matches 1

                          (tree :: Maybe String) = do
                            matches <- Regex.match (Regex.unsafeRegex """<div class="tree">(<ul>.+?<\/ul>)<\/div>""" Regex.noFlags) body
                            join $ NonEmptyArray.index matches 1

                          row =
                            { url: "https://www.purpleculture.net/dictionary-details/?word=" <> kanji
                            , kanji
                            , ideograph
                            , pictophonetic
                            , pictographic
                            , en
                            , tree
                            }

                      traceM row

                      pure $ Just row

    let
        (output' :: Array (Array String)) =
          map
            ( \x ->
              [ x.kanji
              , fromMaybe "" x.ideograph
              , fromMaybe "" x.pictophonetic
              , fromMaybe "" x.pictographic
              , fromMaybe "" x.en
              , fromMaybe "" x.tree
              ]
            )
          $ catMaybes output

    x <- PdfAnkiTranslator.CsvStringify.stringify output'

    Node.FS.Aff.writeTextFile UTF8 "./output.csv" x
