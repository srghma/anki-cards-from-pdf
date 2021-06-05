const R = require('ramda')
const fs = require('fs');

tOrig = fs.readFileSync('./table-with-tabs.txt').toString()
tOrigLines = tOrig.split('\n')
splitLine = line => R.split('\t', line).flat().flat()
sections_ = tOrigLines.filter(R.identity).map(line => ({ sectionLetter: line.trim()[0], pinyins: splitLine(line) }))

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

      min_sherlock_index = v.map(R.prop('sherlock_index')).filter(R.identity)
      min_sherlock_index = min_sherlock_index.length > 0 ? Math.min(...min_sherlock_index) : null

      const findHSK = n => v.filter(x => x.hsk == n)
      const hsks = [1, 2, 3, 4, 5, 6].map(findHSK).map(R.sortBy(R.prop('kanji')))

      let nonHSK7000 = v.filter(x => x.hsk === null && x.chinese_junda_freq_ierogliph_number != null && x.chinese_junda_freq_ierogliph_number <= 7000)
      nonHSK7000 = R.sortBy(R.prop('kanji'), nonHSK7000)

      let other = v.filter(x => x.hsk === null && (x.chinese_junda_freq_ierogliph_number == null || x.chinese_junda_freq_ierogliph_number > 7000))
      other = R.sortBy(R.prop('kanji'), other)

      const subj = [
        ["hsk_1", hsks[0]],
        ["hsk_2", hsks[1]],
        ["hsk_3", hsks[2]],
        ["hsk_4", hsks[3]],
        ["hsk_5", hsks[4]],
        ["hsk_6", hsks[5]],
        ["first",  nonHSK7000],
        ["other", other],
      ]

      let back = subj.filter(([hsk, val]) => val.length > 0).map(([hsk, v]) => {
        let v_ = v.map(R.prop('kanji'))
        // v_ = v_.map(x => [x, toFreqAndGoogle[x].opposite].filter(R.identity).join(''))
        v_ = v_.join('')
        return `${hsk}: ${v_}`
      }).join('<br>')

      let front = subj.map(([hsk, v]) => {
        const val = v.map(v => {
          const markHelp = x => {
            if (!x) { return '' }
            x = removeHTML(dom, x)
            x = x.trim().replace(/\[(\w+)\]/g, '<span class="trainchinese-transl__pinyin-info">[$1]</span>')
            x = x.split('').map(x => {
              if (isHanzi(x)) { return `<span class="trainchinese-transl__hanzi-info">${x}</span>` }
              return x
            }).join('')
            return x
          }

          const trainchinese_cache_with_this_mark = v.trainchinese_cache_with_this_mark.map(x => {
            const pinyin = '<span class="trainchinese-pinyin">' + x.pinyin + '</span>'
            const type = '<span class="trainchinese-type">' + x.type + '</span>'
            const transl_____ = '<span class="trainchinese-transl">' + markHelp(x.transl) + '</span>'
            const res = pinyin + ': (' + type + ') ' + transl_____
            return `<div class="my-pinyin-trainchinese">${res}</div>`
          }).join('<br/>')

          const nodeWithIfNotEmpty = (name, options, x) => x ? nodeWith(name, options, x) : ''

          const div_english = nodeWithIfNotEmpty('div', { class: "my-pinyin-english" }, v.english)
          const div_ru = nodeWithIfNotEmpty('div', { class: "my-pinyin-ru" }, v.ru)

          const do_print_google = !div_english && !div_ru
          // const div_google_ru = nodeWithIfNotEmpty('div', { class: "my-pinyin-google-ru" }, v.google_ru)
          const div_google_en = nodeWithIfNotEmpty('div', { class: "my-pinyin-google-en" }, do_print_google ? v.google_en : null)

          let type = null
          if (TongWen.s_2_t.hasOwnProperty(v.kanji)) { type = 'simpl' }
          if (TongWen.t_2_s.hasOwnProperty(v.kanji)) { type = 'trad' }

          const div_type = nodeWithIfNotEmpty('div', { class: "my-pinyin-type" }, [
            type,
            v.sherlock_index ? `Sherlock ${v.sherlock_index}` : '',
            v.harry_1_index ? `Harry#1 ${v.harry_1_index}` : '',
            v.noah_index ? `Noah ${v.noah_index}` : '',
          ].filter(R.identity).join(', '))

          const transl = `${div_type}${div_english}${div_ru}${div_google_en}${trainchinese_cache_with_this_mark}`

          return { kanji: v.kanji, transl }
        })

        return [hsk, val]
      })

      // front = front.map(([hsk, val]) => val.map((valEl, i) => [`${hsk}_${i + 1}`, valEl])).flat()
      // front = front.map(([hsk, val]) => "kanji transl".split(' ').map(field => [`${hsk}_${field}`, val[field]])).flat()

      // front = front.filter(([hsk, val]) => val.length > 0).map(([hsk, val]) => {
      //   const val_ = val.map(({ kanji, transl }) => `<div class="my-pinyin-hanzi">${`{{c1::${kanji}}}`}</div>${transl}`).join('<hr>')
      //   return `<span class="key">${hsk}</span>:<br>${val_}`
      // }).join('<hr>')

      front = front.filter(([hsk, val]) => val.length > 0).map(([hsk, val]) => {
        const val_ = val.map(({ kanji, transl }) => {
          const nodeWithIfNotEmpty = (name, options, x) => (x || x.length > 0) ? nodeWith(name, options, x) : ''

          const kanjiOpposite = toFreqAndGoogle[kanji].opposite.split('').filter(x => x !== kanji)

          const kanjis = R.concat([kanji], kanjiOpposite)
          // const wrapped = kanjis.map(k => `<a target="_blank" href="plecoapi://x-callback-url/s?q=${encodeURIComponent(kanji)}">${k}</a>`)

          return kanjis
        })
        return { hsk, val_ }
        // return `<span class="key">${hsk}</span>:<br>${val_}`
      })

      const numbered = `${withoutMark}${number}`
      // const sound = `allsetlearning-${numbered}.mp3`

      return {
        numbered,
        marked,
        withoutMark,
        number,
        front,
        back,
        // sound: `[sound:${sound}]`,
        // min_sherlock_index,
        // ...(R.fromPairs(front)),
      }
    },
    (R.groupBy(R.prop('number'), v))
  )
})

toSectionId = x => x.replace(/ü/g, 'v')
myGroupBy = (byFn, key, val, input) => R.toPairs(R.groupBy(byFn, input)).map(x => ({ [key]: x[0], [val]: x[1] }))
t___ = t__.flat().map(R.values).flat().filter(R.identity).map(x => ({ ...x, sectionLetter: x.withoutMark[0] }))
t___ = myGroupBy(R.prop('withoutMark'), "sectionLetter", "pinyins", t___)

// stats = t___.map(R.prop('front'))
// stats = R.map(R.mapObjIndexed(R.prop('length')), stats)
// stats = R.reduce(R.mergeWith((x, y) => R.max(x || 0, y || 0)), {}, stats)
// others = t___.map(R.prop('front')).map(R.prop('Other'))

x = String.raw`
\documentclass[a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[english]{babel}
% \usepackage{afterpage}
% \usepackage{pdflscape}
%% Page break between section.
% \usepackage{titlesec}
%% Use clickable URLs.
\usepackage{url}
% Hypertext links.
\usepackage[hidelinks]{hyperref}
% Footer.
% \usepackage{lastpage}

\usepackage[usegeometry]{typearea}% before geometry!
\usepackage{geometry}
\geometry{
  left=0.5in, right=0.5in, top=0.6in, bottom=1.25in,headheight=23pt,includehead=false
}
\newcommand*{\useportrait}{%
  \clearpage
  \KOMAoptions{paper=portrait,DIV=current}%switch to portrait
  \newgeometry{% geometry settings for portrait
    left=0.05in, right=0.1in, top=0.1in, bottom=0.1in,headheight=0pt,includehead=false
  }%
%   \fancyhfoffset{0pt}% <- recalculate head and foot width for fancyhdr
}
\newcommand*{\uselandscape}{%
  \clearpage
  \KOMAoptions{paper=landscape,DIV=current}%switch to landscape
  \KOMAoptions{paper=7in:17in,DIV=current}%switch to landscape
  \newgeometry{% geometry settings for landscap
    left=0.5in, right=0.5in, top=0.6in, bottom=1.25in,headheight=23pt,includehead=false
  }%
%   \fancyhfoffset{0pt}% recalculate head and foot width for fancyhdr
}
\pagestyle{empty}
\begin{document}

\uselandscape

\begin{center}
 \begin{tabular}{|${sections_[0].pinyins.map(_ => 'c').join('|')}|}
 \hline
${sections_.map(x => ' ' + x.pinyins.map(x => x ? String.raw`\hyperref[sec:${toSectionId(x)}]{${x}}` : '').join(' & ') + String.raw`\\` + '\n').join(' \\hline\n')}
 \hline
\end{tabular}
\end{center}
\useportrait
${
t___.map(({ sectionLetter, pinyins }) => {
  const p = String.raw`
\newpage
\section ${sectionLetter}
\label{sec:${toSectionId(sectionLetter)}}
`
  return p.trim() + '\n' + pinyins.map(pinyin => {
    return pinyin.number + "\n" + pinyin.front.map(x => {
      return x.hsk + "\n" + x.val_.map(x => x.map(x => String.raw`\href{plecoapi://x-callback-url/s?q=${encodeURIComponent(x)}}{${x}}`).join('')).join('\n')
    }).join('\n')
  }).join('\n')
}).join('\n')
}
\end{document}
`

fs.writeFileSync('/tmp/a', x)
(require('child_process').exec(`copyq copy - < /tmp/a`) && null)
