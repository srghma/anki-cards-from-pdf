module PdfAnkiTranslator.CsvParse where

import Effect.Uncurried
import Protolude

import Data.Function.Uncurried (Fn2, runFn2)
import Data.Nullable (Nullable)
import Data.Nullable as Nullable
import Effect.Aff.Compat (EffectFnAff(..), fromEffectFnAff)
import Node.Stream (Readable)

type Output = Array (Array String)

type Options =
  { delimiter :: String
  }
  -- | bom (boolean)
  -- | cast (boolean|function)
  -- | cast_date (boolean|function)
  -- | columns (array|boolean|function)
  -- | columns_duplicates_to_array (boolean)
  -- | comment (string|buffer)
  -- |
  -- | encoding (string|Buffer)
  -- | escape (string|Buffer)
  -- | from (number)
  -- | from_line (number)
  -- | info (boolean)
  -- | ltrim (boolean)
  -- | max_record_size (integer)
  -- | objname (string|Buffer)
  -- | on_record (function)
  -- | quote (char|Buffer|boolean)
  -- | raw (boolean)
  -- | record_delimiter (chars|array)
  -- | relax (boolean)
  -- | relax_column_count (boolean)
  -- | relax_column_count_less (boolean)
  -- | relax_column_count_more (boolean)
  -- | rtrim (boolean)
  -- | skip_empty_lines (boolean)
  -- | skip_lines_with_empty_values (boolean)
  -- | skip_lines_with_error (boolean)
  -- | to (number)
  -- | to_line (number)
  -- | trim (boolean)

foreign import _parse :: forall r . Fn2 Options (Readable r) (EffectFnAff Output)

parse :: forall r . Options -> Readable r -> Aff Output
parse o r = fromEffectFnAff (runFn2 _parse o r)
