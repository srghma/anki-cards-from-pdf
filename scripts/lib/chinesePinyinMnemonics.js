const chinesePinyinMnemonics = (function() {
  let chinesePinyinMnemonics = fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/chinese pinyin mnemonics.tsv').toString()
  chinesePinyinMnemonics = chinesePinyinMnemonics.split('\n').map(x => x.split('\t').map(x => x.trim()))
  const chinesePinyinMnemonics_ = []
  chinesePinyinMnemonics.forEach((row, rowIndex) =>
    row.forEach((col, colIndex) => {
      if (!col.includes(' | ')) { return }
      col_ = col.split(' | ')
      ru = col_.pop()
      chinesePinyinMnemonics_.push({
        en: col_,
        ru,
        human:     chinesePinyinMnemonics[rowIndex][0],
        consonant: chinesePinyinMnemonics[rowIndex][1],
        location:  chinesePinyinMnemonics[0][colIndex],
        vowel:     chinesePinyinMnemonics[1][colIndex],
      })
    })
  )
  return chinesePinyinMnemonics_;
})();

exports.chinesePinyinMnemonics = chinesePinyinMnemonics
