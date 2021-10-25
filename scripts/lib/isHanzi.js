const REGEX_JAPANESE = /[\u3040-\u309f]|[\u30a0-\u30ff]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/
const REGEX_CHINESE = /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/;

const specialChar = "。？！，"
// Hiragana: [\u3040-\u309f]
// Katakana: [\u30a0-\u30ff]
// Roman characters + half-width katakana: [\uff00-\uff9f]
// Roman characters + half-width katakana (more): [\uff00-\uffef]
// Kanji: [\u4e00-\u9faf]|[\u3400-\u4dbf]

function isHanziOrSpecial(ch) {
  return specialChar.includes(ch) || REGEX_JAPANESE.test(ch) || REGEX_CHINESE.test(ch)
}

function isHanzi(ch) {
  return !specialChar.includes(ch) && (REGEX_JAPANESE.test(ch) || REGEX_CHINESE.test(ch))
}

exports.isHanzi = isHanzi
exports.isHanziOrSpecial = isHanziOrSpecial
