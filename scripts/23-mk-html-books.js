const exec = require('await-exec')
const fs = require('fs').promises
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
  await exec(`pdftohtml -enc UTF-8 ${pdf} ${outputdir}/myhtml`)

  let text = await fs.readFile(`${outputdir}/myhtmls.html`)

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
  text = text.replace(/([^(>|！|。|…|\.)])(<\/a>)?<br\/>\n/g, '$1$2')

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

  // await fs.writeFile(`${outputdir}/myhtmls-w.txt`, textWithoutHtml)
  await fs.writeFile(`${outputdir}/myhtmls1.html`, text)
  // await fs.writeFile(`${outputdir}/myhtmls.txt`, text)

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

async function processPurplecultureHtml({ outputdir }) {
  let text = await fs.readFile(`/home/srghma/Downloads/myhtmls.txt`)

  text = text.toString()

  text = text.replace(/< /g, '<')
  text = text.replace(/ >/g, '>')
  text = text.replace(/ \/>/g, '/>')
  text = text.replace(/<\/ /g, '</')
  text = text.replace(/href = " myhtmls . html # (\d+) "/g, 'href="myhtmls.html#$1"')
  text = text.replace(/href="myhtmls.html#/g, 'href="myhtmls-processed.html#')

  await fs.writeFile(`${outputdir}/myhtmls-processed.html`, text)
}

// processPurplecultureHtml("/home/srghma/Desktop/languages/chinese/HuaMa")
// processPurplecultureHtml("/home/srghma/Desktop/languages/chinese/Sherlock")
