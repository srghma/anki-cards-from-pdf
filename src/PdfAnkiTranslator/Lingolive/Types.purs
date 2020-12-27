module PdfAnkiTranslator.Lingolive.Types where

import Data.Argonaut.Decode
import Protolude
import Affjax as Affjax
import Data.Argonaut.Core (Json)
import Data.Argonaut.Decode.Decoders as Decoders
import Data.Argonaut.Decode.Generic.Rep (genericDecodeJson)
import Data.Generic.Rep.Show (genericShow)
import Foreign.Object (Object)

newtype NodeType_Text
  = NodeType_Text
  { "IsItalics" :: Boolean
  , "IsAccent" :: Boolean
  , "Text" :: String
  , "IsOptional" :: Boolean
  }

derive instance genericNodeType_Text :: Generic NodeType_Text _

instance showNodeType_Text :: Show NodeType_Text where
  show x = genericShow x

derive newtype instance eqNodeType_Text :: Eq NodeType_Text

derive newtype instance ordNodeType_Text :: Ord NodeType_Text

----------
newtype NodeType_Example
  = NodeType_Example
  { "Markup" :: Array NodeType -- Text or Abbrev
  , "IsOptional" :: Boolean
  }

derive instance genericNodeType_Example :: Generic NodeType_Example _

instance showNodeType_Example :: Show NodeType_Example where
  show x = genericShow x

derive newtype instance eqNodeType_Example :: Eq NodeType_Example

derive newtype instance ordNodeType_Example :: Ord NodeType_Example

-----------
newtype NodeType_ExampleItem
  = NodeType_ExampleItem
  { "Markup" :: Array NodeType_Example
  , "IsOptional" :: Boolean
  }

derive instance genericNodeType_ExampleItem :: Generic NodeType_ExampleItem _

instance showNodeType_ExampleItem :: Show NodeType_ExampleItem where
  show x = genericShow x

derive newtype instance eqNodeType_ExampleItem :: Eq NodeType_ExampleItem

derive newtype instance ordNodeType_ExampleItem :: Ord NodeType_ExampleItem

----------
newtype NodeType_ListItem
  = NodeType_ListItem
  -- "Node" :: NodeType
  -- "Text" :: Maybe String -- null
  -- | { "IsOptional" :: Boolean -- false
  { "Markup" :: Array NodeType
  }

derive instance genericNodeType_ListItem :: Generic NodeType_ListItem _

instance showNodeType_ListItem :: Show NodeType_ListItem where
  show x = genericShow x

derive newtype instance eqNodeType_ListItem :: Eq NodeType_ListItem

derive newtype instance ordNodeType_ListItem :: Ord NodeType_ListItem

--------------
data NodeType
  = NodeType__Comment -- 0
    { "Markup" :: Array NodeType
    , "IsOptional" :: Boolean
    }
  | NodeType__Paragraph -- 1
    -- | , "Text" :: Maybe String
    { "Markup" :: Array NodeType
    , "IsOptional" :: Boolean
    }
  | NodeType__Text NodeType_Text -- 2
  | NodeType__List -- 3
    { "Type" :: Int -- this is NOT length
    , "Items" :: Array NodeType_ListItem
    }
  -- | | NodeType__ListItem      -- 4
  -- |   {
  -- |   }
  | NodeType__Examples -- 5
    { "IsOptional" :: Boolean
    , "Items" :: Array NodeType_ExampleItem
    }
  -- | , "Type": Maybe String -- null
  -- | | NodeType__ExampleItem   -- 6
  -- |   {
  -- |   }
  -- | | NodeType__Example       -- 7
  -- |   {
  -- |   }
  | NodeType__CardRefs -- 8
    { "IsOptional" :: Boolean
    , "Items" :: Array NodeType
    }
  | NodeType__CardRefItem -- 9
    { "IsOptional" :: Boolean
    , "Markup" :: Array NodeType
    }
  | NodeType__CardRef -- 10
    { "Dictionary" :: String
    , "ArticleId" :: String
    , "Text" :: String
    , "IsOptional" :: Boolean
    }
  | NodeType__Transcription -- 11
    { "Text" :: String
    , "IsOptional" :: Boolean
    }
  | NodeType__Abbrev -- 12
    { "FullText" :: String
    , "Text" :: String
    , "IsOptional" :: Boolean
    }
  | NodeType__Caption -- 13
  -- | {
  -- | }
  | NodeType__Sound -- 14
    { "FileName" :: String
    , "IsOptional" :: Boolean
    }
  | NodeType__Ref -- 15
  -- | {
  -- | }
  | NodeType__Unsupported -- 16

-- | {
-- | }
derive instance genericNodeType :: Generic NodeType _

instance showNodeType :: Show NodeType where
  show x = genericShow x

derive instance eqNodeType :: Eq NodeType

derive instance ordNodeType :: Ord NodeType

------------------
newtype ArticleNode
  = ArticleNode NodeType

derive instance genericArticleNode :: Generic ArticleNode _

instance showArticleNode :: Show ArticleNode where
  show x = genericShow x

derive newtype instance eqArticleNode :: Eq ArticleNode

derive newtype instance ordArticleNode :: Ord ArticleNode

---------------
newtype ArticleModel
  = ArticleModel
  { "Title" :: String
  , "TitleMarkup" :: Array ArticleNode -- NodeType_Text
  , "Dictionary" :: String
  , "ArticleId" :: String
  , "Body" :: Array ArticleNode
  }

derive instance genericArticleModel :: Generic ArticleModel _

instance showArticleModel :: Show ArticleModel where
  show x = genericShow x

derive instance eqArticleModel :: Eq ArticleModel

derive instance ordArticleModel :: Ord ArticleModel
