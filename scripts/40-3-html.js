t__ = t_.map(([k, v]) => {
  return R.mapObjIndexed(
    (v, k) => {
      if (!v) { return null }

      const { marked, number, withoutMark } = v[0]

      v = v.map(x => {
        return {
          ...x,
          ...(toFreqAndGoogle[x.kanji] || {}),
        }
      })

      let min_sherlock_index = v.map(R.prop('sherlock_index')).filter(R.identity)
      min_sherlock_index = min_sherlock_index.length > 0 ? Math.min(...min_sherlock_index) : null

      const findHSK = n => v.filter(x => x.hsk == n)
      const hsks = [1, 2, 3, 4, 5, 6].map(findHSK).map(R.sortBy(R.prop('kanji')))

      let nonHSK7000 = v.filter(x => x.hsk === null && x.chinese_junda_freq_ierogliph_number != null && x.chinese_junda_freq_ierogliph_number <= 7000)
      nonHSK7000 = R.sortBy(R.prop('kanji'), nonHSK7000)

      let other = v.filter(x => x.hsk === null && (x.chinese_junda_freq_ierogliph_number == null || x.chinese_junda_freq_ierogliph_number > 7000))
      other = R.sortBy(R.prop('kanji'), other)

      // const already_processed_kanji = ([...hsks, nonHSK7000, other]).flat().map(R.prop('kanji')).join('')
      // const bkrs_all = input.filter(x => x.bkrs_pinyin.includes(marked))
      // const bkrs = bkrs_all.filter(x => !already_processed_kanji.includes(x.kanji))

      const subj = [
        hsks[0],
        hsks[1],
        hsks[2],
        hsks[3],
        hsks[4],
        hsks[5],
        nonHSK7000,
        other,
      ].flat()

      let back = R.uniq(subj.map(x => x.kanji)).join('\n\n―――――――――――――――――――――――――――――――\n\n')

      const numbered = `${withoutMark}${number}`

      return {
        numbered,
        marked,
        withoutMark,
        number,
        back,
      }
    },
    (R.groupBy(R.prop('number'), v))
  )
})

groupByAndToArray = (byFn, key, val, input) => R.toPairs(R.groupBy(byFn, input)).map(x => ({ [key]: x[0], [val]: x[1] }))

tOrig = fs.readFileSync('./table-with-tabs.txt').toString()
tOrigLines = tOrig.split('\n')
splitLine = line => R.split('\t', line).flat().flat()
sections_ = tOrigLines.filter(R.identity).map(line => ({ sectionLetter: line.trim()[0], pinyins: splitLine(line) }))
toSectionId = x => x.replace(/ü/g, 'v')

t___ = t__.flat().map(R.values).flat().filter(R.identity).map(x => ({ ...x, sectionLetter: x.withoutMark[0] }))
// t___ = groupByAndToArray(R.prop('withoutMark'), "sectionLetter", "pinyins", t___)

t___.forEach(x => {
  fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/ru-pinyin/${x.numbered}`, x.back)
})
