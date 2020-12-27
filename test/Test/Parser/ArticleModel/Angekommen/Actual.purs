module Test.Parser.ArticleModel.Angekommen.Actual where

import Protolude
import PdfAnkiTranslator.Lingolive.Types
import Data.Array.NonEmpty (NonEmptyArray)
import Data.Array.NonEmpty as NonEmptyArray

actual :: NonEmptyArray ArticleModel
actual = NonEmptyArray.singleton (ArticleModel { "ArticleId": "Universal (De-Ru)__angekommen", "Body": [ (ArticleNode (NodeType__Paragraph { "IsOptional": false, "Markup": [ (NodeType__Abbrev { "FullText": "Partizip II — причастие II", "IsOptional": false, "Text": "part II" }), (NodeType__Text (NodeType_Text { "IsAccent": false, "IsItalics": true, "IsOptional": false, "Text": "от " })), (NodeType__CardRef { "ArticleId": "Universal (De-Ru)__ankommen", "Dictionary": "Universal (De-Ru)", "IsOptional": false, "Text": "ankommen" }) ] })) ], "Dictionary": "Universal (De-Ru)", "Title": "angekommen", "TitleMarkup": [ (ArticleNode (NodeType__Text (NodeType_Text { "IsAccent": true, "IsItalics": false, "IsOptional": false, "Text": "a" }))), (ArticleNode (NodeType__Text (NodeType_Text { "IsAccent": false, "IsItalics": false, "IsOptional": false, "Text": "ngekommen" }))) ] })
