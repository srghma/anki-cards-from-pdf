module PdfAnkiTranslator.ReadStdin where

import Prelude

import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Effect.Aff (Aff, makeAff, effectCanceler)
import Effect.Ref as Ref
import Node.Encoding (Encoding(..))
import Node.Process (stdin)
import Node.Stream (Readable, onDataString, onEnd, onError, pause)

-- from https://github.com/etrepum/aoc-2020/blob/e2d022101cf74fd01ac725399ff40c367a76059d/aoc-2020-14/src/Input.purs#L16

foreign import stdinIsTTY :: Boolean

readText :: forall w. Readable w -> Aff String
readText r = makeAff $ \res -> do
  dataRef <- Ref.new ""
  onDataString r UTF8 \chunk ->
    Ref.modify_ (_ <> chunk) dataRef
  onEnd r do
    allData <- Ref.read dataRef
    res $ Right allData
  onError r $ Left >>> res
  pure $ effectCanceler (pause r)

readStdin :: Aff (Maybe String)
readStdin =
  if stdinIsTTY then pure Nothing
  else Just <$> readText stdin

