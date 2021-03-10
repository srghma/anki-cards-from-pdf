const exec = require('await-exec')
const fixRadicalToKanji = require('./lib/fixRadicalToKanji').fixRadicalToKanji
const R = require('ramda')
const RA = require('ramda-adjunct')

folders = [
  { pdf: "/home/srghma/Desktop/languages/chinese/In_Search_of_Hua_Ma.pdf", outputdir: "/home/srghma/Desktop/languages/chinese/HuaMa" },
  { pdf: "/home/srghma/Desktop/languages/chinese/Sherlock_Holmes.pdf", outputdir: "/home/srghma/Desktop/languages/chinese/Sherlock" },
  { pdf: "/home/srghma/Desktop/languages/chinese/Journey_to_the_Center_of_the_Earth.pdf", outputdir: "/home/srghma/Desktop/languages/chinese/Journey" },
  { pdf: "/home/srghma/Desktop/languages/chinese/The_Monkeys_Paw.pdf", outputdir: "/home/srghma/Desktop/languages/chinese/Monkey" },
]

async function createHtml({ pdf, outputdir }) {
  await exec(`mkdir -p ${outputdir}`)
  await exec(`rm -f ${outputdir}/*.html ${outputdir}/*.png ${outputdir}/*.jpg`)
  await exec(`/nix/store/5drv2qajbhb8qbr9pd2arq1b3p68l1aa-poppler-utils-21.03.0/bin/pdftohtml -enc UTF-8 ${pdf} ${outputdir}/myhtml`)
  // await exec(`pdftops ${pdf} ${outputdir}/myps.ps`)
  // await exec(`pdftotext -layout ${pdf} ${outputdir}/my.txt`)

  let text = await require('fs').promises.readFile(`${outputdir}/myhtmls.html`)

  text = text.toString()
  text = fixRadicalToKanji(text)

  text = text.replace(/&#160;/g, ' ')
  text = text.replace(/\[\d+\]/g, '')
  text = text.replace(/(.)<br\/>(.)/g, '$1 $2')
  text = text.replace(/&#34;/g, '"')
  text = text.replace(/<b>\s*<\/b>/g, '')
  // text = text.replace(/<a.*?>\s*<\/a>/g, '') // will remove anchors
  text = text.replace(/<b>(\d+)<\/b><br\/>\n([^<]+)<br\/>/g, '<b><i>$1</i> $2</b><br/>')

  text = text.replace(/﻿/g, '')
  // text = text.replace(/([^(>|！|。|…|\.)])(<\/a>)?<br\/>\n/g, '$1$2')

  // remove space between hanzi
  text = text.replace(/([\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3300-\u33ff\uf900-\ufaff])\s+([\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3300-\u33ff\uf900-\ufaff])/ug, '$1$2')
  text = text.replace(/([\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3300-\u33ff\uf900-\ufaff])\s+([\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3300-\u33ff\uf900-\ufaff])/ug, '$1$2')
  text = text.replace(/([\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3300-\u33ff\uf900-\ufaff])\s+([\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3300-\u33ff\uf900-\ufaff])/ug, '$1$2')

  // text = text.replace(/<br\/>/g, '<br/>\n')

  // const textWithoutHtml = text.split(/(<([^>]+)>)/gi).filter(x => x != '')

  text = text.replace(/(<style type="text\/css">)\n/g, `$1
img {
  max-width: 90%;
  max-height: 80%;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
a {
  text-decoration: none;
  color: blue;
}
`)

  // await require('fs').promises.writeFile(`${outputdir}/myhtmls-w.txt`, textWithoutHtml)
  await require('fs').promises.writeFile(`${outputdir}/myhtmls1.html`, text)
  // await require('fs').promises.writeFile(`${outputdir}/myhtmls.txt`, text)

  return text
}

textes = await Promise.all(folders.map(createHtml))

// // create input for https://easypronunciation.com/ru/chinese-pinyin-phonetic-transcription-converter
// textes_ = textes.map(x => x.replace(/<style.*>.+<\/style>/gs, '').replace(/<[^>]+>/gi, '\n').replace(/(。|？|！|，)/gi, '\n').split('\n').map(x => x.trim()).filter(x => x != ''))
// textes_ = textes_.flat()
// textes_ = textes_.map(x => x.split(/[^\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3300-\u33ff\uf900-\ufaff]/))
// textes_ = textes_.flat()
// textes_ = textes_.map(x => x.trim())
// textes_ = textes_.filter(x => x != '')
// textes_ = R.uniq(textes_)
// textes_ = R.sortBy(x => x.length, textes_)

// console.log('\n')
// console.log(textes_.slice(2000, 10000).join('\n'))
// console.log('\n')
// console.log(textes_.slice(4600).join('\n'))
// textes_.findIndex(x => x == '当我去找水喝的时候')

// require('fs').writeFileSync(
//   '/home/srghma/projects/anki-cards-from-pdf/ipa-output/purpleculture-words-input.txt',
//   R.uniq(Object.values(ipwordscache).flat().map(x => x.chineseIerogliphOrWord)).join('\n')
// )

// R.reverse(R.sortBy(x => x.length, (Object.keys(ipwordscache))))

// async function processPurplecultureHtml({ outputdir }) {
//   let text = await require('fs').promises.readFile(`/home/srghma/Downloads/myhtmls.txt`)

//   text = text.toString()

//   text = text.replace(/< /g, '<')
//   text = text.replace(/ >/g, '>')
//   text = text.replace(/ \/>/g, '/>')
//   text = text.replace(/<\/ /g, '</')
//   text = text.replace(/href = " myhtmls . html # (\d+) "/g, 'href="myhtmls.html#$1"')
//   text = text.replace(/href="myhtmls.html#/g, 'href="myhtmls-processed.html#')

//   await require('fs').promises.writeFile(`${outputdir}/myhtmls-processed.html`, text)
// }

// processPurplecultureHtml("/home/srghma/Desktop/languages/chinese/HuaMa")
// processPurplecultureHtml("/home/srghma/Desktop/languages/chinese/Sherlock")

// ipwordscache =
async function addPinyinAndIpaToHtml({ outputdir }) {
  const purplecultureWords_ = Object.fromEntries(R.reverse(R.sortBy(x => x[0].length, purplecultureWords.map(({ ch, tr }) => [ch, tr]))))

  let text = await require('fs').promises.readFile(`${outputdir}/myhtmls1.html`)
  text = text.toString()

  text = text.replace(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3300-\u33ff\uf900-\ufaff]+/g, k => {
    const v = ipwordscache[k]

    if(!v) { console.log({ k }); throw new Error('no ipa') }

    const v_ = v.map(({ chineseIerogliphOrWord, chineseIerogliphOrWordPronounce }) => {
      let pinyin = purplecultureWords_[chineseIerogliphOrWord]

      if (!pinyin) {
        pinyin = chineseIerogliphOrWord.split('').map(x => {
          const o = purplecultureWords_[x]
          if (!o) { throw new Error('no purpleculture splitted transl') }
          return o
        }).join('').trim()
      }

      if (!RA.isNonEmptyString(pinyin)) {
        console.log({ chineseIerogliphOrWord });
        throw new Error('no pinyin')
      }

      const chineseIerogliphOrWordPronounce_ = R.uniq(chineseIerogliphOrWordPronounce).map(x => {
        return `<span class="my-chinese-ipa">${x}</span>`
      }).join('')

      return `<span class="my-chinese-container"><span class="my-chinese-word">${chineseIerogliphOrWord}</span><span class="my-chinese-pinyin">${pinyin}</span><span class="my-chinese-ipa-container">${chineseIerogliphOrWordPronounce_}</span></span>`
    })

    return v_.join('')
  })

  text = text.replace(/"myhtmls.html/g, '"')

  text = text.replace(/(<style type="text\/css">)\n/g, `
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Voces&display=swap" rel="stylesheet">

$1
@font-face {
  font-family: 'CNstrokeorder';
  src: url('file:///home/srghma/projects/anki-cards-from-pdf/CNstrokeorder.ttf');
}
@font-face {
  font-family: 'KanjiStrokeOrders';
  src: url('file:///home/srghma/projects/anki-cards-from-pdf/KanjiStrokeOrders.ttf');
}
body {
  font-size: 35px;
  font-family: 'Noto Sans SC', sans-serif;
}
.my-chinese-container {
  flex-direction: column-reverse;
  display: inline-flex;
  text-align: center;
  margin-left: 10px;
}
.my-chinese-word {
  font-size: 55px;
}
.my-chinese-ipa { margin-left: 10px; font-family: 'Voces', cursive; }
.my-chinese-pinyin, .my-chinese-ipa-container {
  font-size: 30px;
}
`)

  await require('fs').promises.writeFile(`${outputdir}/myhtmls2.html`, text)
}

await Promise.all(folders.map(addPinyinAndIpaToHtml))
