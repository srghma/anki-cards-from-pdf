function mapWithForEachToArray(xs, fn) {
  const output = []
  xs.forEach(x => output.push(fn(x)))
  return output
}

dom.window.document.body.innerHTML = fs.readFileSync('/tmp/zshShpEX9').toString()

ipwordscache = mapWithForEachToArray(
  dom.window.document.querySelectorAll('div.big-hanzi p'),
  pEl => {
    const chineseText = mapWithForEachToArray(pEl.querySelectorAll('a.hsk-white'), aEl => aEl.textContent.trim()).join('')

    console.log({ chineseText, innerHTML: pEl.innerHTML })

    if (chineseText.length == 0) {
      if (pEl.innerHTML == '') { return }

      return {
        chineseText: pEl.querySelector('ruby').textContent.replace(/&nbsp;/g, '').trim(),
        rubies: []
      }
    }

    const rubies = mapWithForEachToArray(
      pEl.querySelectorAll('ruby'),
      rubyEl => {
        const chineseIerogliphOrWord = rubyEl.querySelector('a.hsk-white').textContent.trim()

        console.log({ chineseIerogliphOrWord })

        const nobrs = mapWithForEachToArray(
          rubyEl.querySelectorAll('.chineseHomographsList nobr'),
          nobrEl => nobrEl.textContent.trim()
        )

        console.log({ nobrs })

        if (nobrs.length > 0) {
          return {
            chineseIerogliphOrWord,
            chineseIerogliphOrWordPronounce: nobrs,
          }
        }

        const rtText = rubyEl.querySelector('rt').textContent.trim()

        console.log({ rtText })

        return {
          chineseIerogliphOrWord,
          chineseIerogliphOrWordPronounce: [ rtText ],
        }
      }
    )

    return { chineseText, rubies }
  }
).filter(R.identity).map(x => [x.chineseText, x.rubies])

ipwordscache = Object.fromEntries(ipwordscache)

fs.writeFileSync(ipwordscache_path, JSON.stringify(ipwordscache, null, 2))
