const exec = require('await-exec')
const fs = require('fs').promises
const fixRadicalToKanji = require('./lib/fixRadicalToKanji').fixRadicalToKanji

folders = [
  { pdf: "/home/srghma/Desktop/languages/chinese/In_Search_of_Hua_Ma.pdf", outputdir: "/home/srghma/Desktop/languages/chinese/HuaMa" },
  { pdf: "/home/srghma/Desktop/languages/chinese/Sherlock_Holmes.pdf", outputdir: "/home/srghma/Desktop/languages/chinese/Sherlock" }
]

async function createHtml({ pdf, outputdir }) {
  await exec(`rm -rfd ${outputdir}`)
  await exec(`mkdir -p ${outputdir}`)
  await exec(`pdftohtml ${pdf} ${outputdir}/myhtml`)

  let text = await fs.readFile(`${outputdir}/myhtmls.html`)

  text = text.toString()
  text = fixRadicalToKanji(text)

  text = text.replace(/&#160;/g, ' ')
  text = text.replace(/\[\d+\]/g, '')
  text = text.replace(/(.)<br\/>(.)/g, '$1 $2')
  text = text.replace(/&#34;/g, '"')
  text = text.replace(/<b>\s*<\/b>/g, '')
  text = text.replace(/<a.*?>\s*<\/a>/g, '')
  text = text.replace(/<b>(\d+)<\/b><br\/>\n([^<]+)<br\/>/g, '<b><i>$1</i> $2</b><br/>')

  text = text.replace(/﻿/g, '')
  text = text.replace(/([^(>|！|。|…|\.)])(<\/a>)?<br\/>\n/g, '$1$2')
  // text = text.replace(/<br\/>/g, '<br/>\n')

  const textWithoutHtml = text.replace(/(<([^>]+)>)/gi, "")

  text = text.replace(/(<style type="text\/css">)\n/g, `$1
img {
  max-width: 90%;
  max-height: 90%;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
a {
  text-decoration: none;
}
`)

  await fs.writeFile(`${outputdir}/myhtmls-w.txt`, textWithoutHtml)
  await fs.writeFile(`${outputdir}/myhtmls.html`, text)
  await fs.writeFile(`${outputdir}/myhtmls.txt`, text)
}

async function processPurplecultureHtml({ outputdir }) {
  let text = await fs.readFile(`${outputdir}/myhtmls-processed.html`)

  text = text.toString()

  text = text.replace(/< /g, '<')
  text = text.replace(/ >/g, '>')
  text = text.replace(/ \/>/g, '/>')
  text = text.replace(/<\/ /g, '</')
  text = text.replace(/href = " myhtmls . html # (\d+) "/g, 'href="myhtmls.html#$1"')
  text = text.replace(/href="myhtmls.html#/g, 'href="myhtmls-processed.html#')

  await fs.writeFile(`${outputdir}/myhtmls-processed.html`, text)
}

Promise.all(folders.map(processPurplecultureHtml))
// Promise.all(folders.map(createHtml))
