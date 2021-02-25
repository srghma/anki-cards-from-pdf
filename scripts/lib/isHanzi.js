function isHanzi(ch) {
  const REGEX_JAPANESE = /[\u3040-\u309f]|[\u30a0-\u30ff]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/
  const REGEX_CHINESE = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;

  // Hiragana: [\u3040-\u309f]
  // Katakana: [\u30a0-\u30ff]
  // Roman characters + half-width katakana: [\uff00-\uff9f]
  // Roman characters + half-width katakana (more): [\uff00-\uffef]
  // Kanji: [\u4e00-\u9faf]|[\u3400-\u4dbf]

  // const isJapaneseStylePunctuation = [\u3000-\u303f]
  const isSpecialChar = "。？！，".includes(ch)
  const isJapanese = REGEX_JAPANESE.test(ch)
  const isChinese = REGEX_CHINESE.test(ch)
  const isHanzi = !isSpecialChar && (isJapanese || isChinese)

  return isHanzi
}

exports.isHanzi = isHanzi