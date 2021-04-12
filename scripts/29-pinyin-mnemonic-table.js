const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const tableOrig = require('./scripts/lib/tableOrig').tableOrig
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const nodeWith = require('./scripts/lib/nodeWith').nodeWith
const mapWithForEachToArray = require('./scripts/lib/mapWithForEachToArray').mapWithForEachToArray
const arrayToRecordByPosition = require('./scripts/lib/arrayToRecordByPosition').arrayToRecordByPosition
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});
toNumberOrNull = str => { if (!str) { return null }; var num = parseFloat(str); if (isFinite(num)) { return num; } else { return null; }; }
checkSameLength = (x, y) => { if (x.length != y.length) { throw new Error(`x.length (${x.length}) != y.length (${y.length})`) } }
zipOrThrowIfNotSameLength = (x, y) => { checkSameLength(x, y); return R.zip(x, y); }

// table = await readStreamArray(fs.createReadStream('/home/srghma/projects/anki-cards-from-pdf/chinese pinyin mnemonics2.tsv').pipe(csv({ separator: "\t", headers: "ru en 0 1 2 3 4 5".split(" ") })))
// table = table.map(x => ({ ...x, ruen: `${x.ru}|${x.en}` }))
// table = R.map(x => x[0], R.groupBy(R.prop('ruen'), table))
// table = R.map(x => {
//   x = R.map(x => x.split(' ')[0].trim(), x)
//   return R.pick('1 2 3 4 5'.split(' '), x)
// }, table)

allKanjiOrig = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: "kanji 2 3 4 5 6 7 8 9 purpleculture_pinyin purpleculture_hsk chinese_junda_freq_ierogliph_number".split(" ") })))

// listOfKanji = allKanjiOrig.map(x => ({
//   kanji:                               x.kanji,
//   purpleculture_hsk:                   toNumberOrNull(x.purpleculture_hsk),
//   chinese_junda_freq_ierogliph_number: toNumberOrNull(x.chinese_junda_freq_ierogliph_number),
//   purpleculture_pinyin:                x.purpleculture_pinyin ? (Array.from(x.purpleculture_pinyin.matchAll(/mp3\/([^\.]+)/g) || [])).map(x => x[1]) : []
// }))
// pinyinToKanji = listOfKanji.map(x => x.purpleculture_pinyin.map(purpleculture_pinyin=> ({ ...x, purpleculture_pinyin}))).flat()
// pinyinToKanji = R.groupBy(R.prop('purpleculture_pinyin'), pinyinToKanji)

// printed = listOfKanji.map(x => {
//   const printRow  = ([k, class_, v]) => {
//     v = R.sortBy(R.prop('chinese_junda_freq_ierogliph_number'), v)
//     if (v.length <= 0) { return null }
//     const key = nodeWith('span', { class: "key" }, k)
//     const val = v
//       .map(R.prop('kanji'))
//       .map(nodeWith('span', { class: ["kanji"] }))
//       .join(',')
//     return nodeWith('div', { class: ["row", `row-${class_}`] }, `${key}: ${val}`)
//   }
//   const withSamePronouciation_ = x.purpleculture_pinyin.map(pinyin => {
//     const v_ = pinyinToKanji[pinyin]
//     const findHSK = n => v_.filter(x => x.purpleculture_hsk == n)
//     const printedValues = [
//       ["HSK 1", "hsk-1", findHSK(1)],
//       ["HSK 2", "hsk-2", findHSK(2)],
//       ["HSK 3", "hsk-3", findHSK(3)],
//       ["HSK 4", "hsk-4", findHSK(4)],
//       ["HSK 5", "hsk-5", findHSK(5)],
//       ["HSK 6", "hsk-6", findHSK(6)],
//       ["5000",  "5000", v_.filter(x => x.chinese_junda_freq_ierogliph_number <= 5000 && x.purpleculture_hsk === null)],
//       ["Other", "other", v_.filter(x => x.chinese_junda_freq_ierogliph_number > 5000 && x.purpleculture_hsk === null)],
//     ].map(printRow).filter(x => x != null)
//     return `
//     <div class="pinyin">${pinyin}</div>
//     <div class="same-pronounciation">${printedValues}</div>
//     `
//   }).join('\n')
//   return {
//     kanji: x.kanji,
//     withSamePronouciation_,
//   }
// })

// ;(function(input){
//   const s = input.map(x => Object.values(x).join('\t')).join('\n')
//   // const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
//   // const s = require('csv-writer').createObjectCsvStringifier({ header, fieldDelimeter: ";" }).stringifyRecords(input)
//   fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
// })(printed);

allKanji = R.map(R.pick("kanji purpleculture_hsk chinese_junda_freq_ierogliph_number purpleculture_pinyin".split(" ")), allKanjiOrig)
allKanji = R.map(R.over(R.lensProp("purpleculture_pinyin"), x => {
  x = Array.from(x.matchAll(/<a class="pinyin tone(\d+)\s*" href="https:\/\/www\.purpleculture\.net\/mp3\/([^\.]+)\.mp3">([^<]+)<\/a>/g))
  x = x.map(x => ({ number: x[1], numbered: x[2], marked: x[3] }))
  x = x.map(x => ({ ...x, withoutMark: x.numbered.replace(/\d+/g, '') }))
  console.log(x)
  return x
}), allKanji)
allKanji = allKanji.map(kanjiInfo => kanjiInfo.purpleculture_pinyin.map(pinyinInfo => ({
  // numbered: 'shan4',
  kanji: kanjiInfo.kanji,
  purpleculture_hsk: toNumberOrNull(kanjiInfo.purpleculture_hsk),
  chinese_junda_freq_ierogliph_number: toNumberOrNull(kanjiInfo.chinese_junda_freq_ierogliph_number),
  number: toNumberOrNull(pinyinInfo.number),
  marked: pinyinInfo.marked,
  withoutMark: pinyinInfo.withoutMark,
}))).flat()

// { '1': 332, '2': 258, '3': 321, '4': 355, '5': 36 }
// R.mapObjIndexed(R.compose(R.prop('length'), R.uniq, R.map(R.prop('withoutMark'))), R.groupBy(R.prop('number'), allKanji))

// pinyin = R.mapObjIndexed(R.compose(x => x.sort(), R.uniq, R.map(R.prop('withoutMark'))), R.groupBy(R.prop('number'), allKanji))

table = tableOrig.split('\n').map(x => x.split('\t'))
h = table[0].slice(2)
h = R.splitEvery(2, h).map(R.prop(0)).map(R.trim)
table = table.slice(1).map(([verb, _, ...pinyin]) => ({ verb, pinyin: R.splitEvery(2, pinyin) }))
table = table.map(({ verb, pinyin }) => {
  return R.zipWith(([pinyin, link], header) => ({ pinyin, link, header, verb }), pinyin, h)
})
table = table.flat()
table = table.filter(({ pinyin }) => pinyin)

const puppeteer = require('puppeteer');
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: false })
const page = await browser.newPage()

function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time)
  });
}

mkQueue(1).addAll(
  table.map((x, i) => async jobIndex => {
    await page.goto(x.link, { waitUntil: 'networkidle2' });
    await delay(4000)
    const buffer = await page.screenshot({ type: 'png', fullPage: true });
    fs.writeFileSync(`/home/srghma/.local/share/Anki2/User 1/collection.media/mnemonic-places-google/${x.pinyin}.png`, buffer, 'binary')
    console.log(`wrote ${x.pinyin} ${i}`)
  })
)

pinyinCss = table.map(x => `.my-pinyin-image-container.pinyin-${x.pinyin} img:nth-child(2) { content: url(mnemonic-places-google/${x.pinyin}.png); }
.my-pinyin-image-container.pinyin-${x.pinyin} span:before { content: "${x.header}, ${x.verb}"; }`).join('\n')
console.log('\n' + pinyinCss)


// dir = '1-world'
// parentDir = '/home/srghma/.local/share/Anki2/User 1/collection.media'
// files = fs.readdirSync(`${parentDir}/mnemonic-places/${dir}`)
// filesWithPinyin = R.zip(R.uniq(R.map(R.prop('withoutMark'), allKanji)).sort(), files)
// pinyinCss = [
//   "1-high.jpg",
//   "2-what.jpg",
//   "3-convultion.jpg",
//   "4-no.jpg",
//   "5-stop.jpg",
// ].map((x, i) => `.my-pinyin-image-container.pinyin-number-${i + 1} img:nth-child(3) { content: url(mnemonic-places/${x}); }`).join('\n')
// pinyinCss = pinyinCss + '\n' + filesWithPinyin.map(x => `.my-pinyin-image-container.pinyin-${x[0]} img:nth-child(2) { content: url(mnemonic-places/${dir}/${encodeURIComponent(x[1])}); }
// .my-pinyin-image-container.pinyin-${x[0]} span:before { content: "${x[1].replace(/\.jpg/g, '')}"; }
// `).join('\n')
// fs.writeFileSync('/home/srghma/.local/share/Anki2/User 1/collection.media/mnemonic-places/pinyin-to-countries.css', pinyinCss)
allKanjiForTable = R.groupBy(R.prop('withoutMark'), R.sortBy(R.prop('withoutMark'), allKanji))

t = `a	ai	ao	an	ang	e	ei	en	eng	er	o	ou		yi		ya	yao	ye	you	yan	yang	yin	ying	yong	wu	wa	wai	wei	wo	wan	wang	wen	weng	yu	yue	yuan	yun
ba	bai	bao	ban	bang		bei	ben	beng		bo			bi			biao	bie		bian		bin	bing		bu
pa	pai	pao	pan	pang		pei	pen	peng		po	pou		pi			piao	pie		pian		pin	ping		pu
ma	mai	mao	man	mang	me	mei	men	meng		mo	mou		mi			miao	mie	miu	mian		min	ming		mu
fa			fan	fang		fei	fen	feng		fo	fou													fu
da	dai	dao	dan	dang	de	dei	den	deng			dou	dong	di			diao	die	diu	dian			ding		du			dui	duo	duan		dun
ta	tai	tao	tan	tang	te			teng			tou	tong	ti			tiao	tie		tian			ting		tu			tui	tuo	tuan		tun
na	nai	nao	nan	nang	ne	nei	nen	neng			nou	nong	ni			niao	nie	niu	nian	niang	nin	ning		nu				nuo	nuan				nü	nüe
la	lai	lao	lan	lang	le	lei		leng		lo	lou	long	li		lia	liao	lie	liu	lian	liang	lin	ling		lu				luo	luan		lun		lü	lüe
za	zai	zao	zan	zang	ze	zei	zen	zeng			zou	zong		zi										zu			zui	zuo	zuan		zun
ca	cai	cao	can	cang	ce	cei	cen	ceng			cou	cong		ci										cu			cui	cuo	cuan		cun
sa	sai	sao	san	sang	se		sen	seng			sou	song		si										su			sui	suo	suan		sun
zha	zhai	zhao	zhan	zhang	zhe	zhei	zhen	zheng			zhou	zhong		zhi										zhu	zhua	zhuai	zhui	zhuo	zhuan	zhuang	zhun
cha	chai	chao	chan	chang	che		chen	cheng			chou	chong		chi										chu	chua	chuai	chui	chuo	chuan	chuang	chun
sha	shai	shao	shan	shang	she	shei	shen	sheng			shou			shi										shu	shua	shuai	shui	shuo	shuan	shuang	shun
    rao	ran	rang	re		ren	reng			rou	rong		ri										ru	rua		rui	ruo	ruan		run
                          ji		jia	jiao	jie	jiu	jian	jiang	jin	jing	jiong										ju	jue	juan	jun
                          qi		qia	qiao	qie	qiu	qian	qiang	qin	qing	qiong										qu	que	quan	qun
                          xi		xia	xiao	xie	xiu	xian	xiang	xin	xing	xiong										xu	xue	xuan	xun
ga	gai	gao	gan	gang	ge	gei	gen	geng			gou	gong												gu	gua	guai	gui	guo	guan	guang	gun
ka	kai	kao	kan	kang	ke	kei	ken	keng			kou	kong												ku	kua	kuai	kui	kuo	kuan	kuang	kun
ha	hai	hao	han	hang	he	hei	hen	heng			hou	hong												hu	hua	huai	hui	huo	huan	huang	hun`

t_ = t.split('\n').map(R.trim()).filter(R.identity).map(R.split('\t')).flat().flat().filter(R.identity).map(x => {
  if(!x) { return null }
  const x_ = {
    'nü': 'nv',
    'lü': 'lv',
    'lüe': 'lve',
    'nüe': 'nve',
  }[x] || x
  const r = allKanjiForTable[x_]
  if (!r) {
    if(x === 'cei') { return null }
    if(x === 'zhei') { return null }
    if(x === 'chua') { return null }
    if(x === 'rua') { return null }
    if(x === 'eng') { return null }
    if(x === 'den') { return null }
    throw new Error(x)
  }
  return [x, r]
}).filter(R.identity)

t__ = t_.map(([k, v]) => {
  return R.values(R.mapObjIndexed(
    (v, k) => {
      if (!v) { return null }
      const { marked, number, withoutMark } = v[0]

      const findHSK = n => v.filter(x => x.purpleculture_hsk == n)

      const printRow  = ([k, class_, v]) => {
        if (v.length <= 0) { return null }
        const key = nodeWith('span', { class: "key" }, k)
        const val = v
          .map(R.prop('kanji'))
          .map(nodeWith('span', { class: ["kanji"] }))
          .join(', ')
        return nodeWith('div', { class: ["row", `row-${class_}`] }, `${key}: ${val}`)
      }

      const printedValues = [
        ["HSK 1", "hsk-1", findHSK(1)],
        ["HSK 2", "hsk-2", findHSK(2)],
        ["HSK 3", "hsk-3", findHSK(3)],
        ["HSK 4", "hsk-4", findHSK(4)],
        ["HSK 5", "hsk-5", findHSK(5)],
        ["HSK 6", "hsk-6", findHSK(6)],
        ["5000",  "5000", v.filter(x => x.chinese_junda_freq_ierogliph_number <= 5000 && x.purpleculture_hsk === null)],
        ["Other", "other", v.filter(x => x.chinese_junda_freq_ierogliph_number > 5000 && x.purpleculture_hsk === null)],
      ].map(printRow).filter(x => x != null)

      // let head = marked
      // head = nodeWith('span', { class: "marked" }, head)
      // return [head, ...printedValues].join('\n')

      const printRow2  = ([k, class_, v]) => {
        if (v.length <= 0) { return null }
        return `${k}: ${v.map(R.prop('kanji')).join('')}`
      }

      const freq_hanzi = [
        ["HSK 1", "hsk-1", findHSK(1)],
        ["HSK 2", "hsk-2", findHSK(2)],
        ["HSK 3", "hsk-3", findHSK(3)],
        ["HSK 4", "hsk-4", findHSK(4)],
        ["HSK 5", "hsk-5", findHSK(5)],
        ["HSK 6", "hsk-6", findHSK(6)],
        ["5000",  "5000", v.filter(x => x.chinese_junda_freq_ierogliph_number <= 5000 && x.purpleculture_hsk === null)],
      ].map(printRow2).filter(x => x != null)

      return {
        marked,
        number,
        printedValues: printedValues.join('<br>'),
        freq_hanzi: freq_hanzi.join('<br>'),
      }
    },
    ({ 1: null, 2: null, 3: null, 4: null, 5: null, ...(R.groupBy(R.prop('number'), v)) })
  ))
})

t___ = t__.flat().flat().filter(R.identity)

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(t___);

// pinyinToImageForTable = R.pipe(
//   R.groupBy(R.prop('purpleculture_pinyin')),
//   R.map(R.groupBy(R.prop('n'))),
//   R.map(R.map(x => x[0]))
// )(pinyin)

cities_ = R.reverse(R.sortBy(R.prop('population'), require('all-the-cities')))
cities_ = R.map(R.pick('cityId name country'.split(' ')), cities_)
cities_ = R.fromPairs(R.map(x => [x.cityId, R.pick('name country'.split(' '), x)], cities_))

// citiesBuff = cities_
// output = R.fromPairs(R.reverse(R.sortBy(R.prop('length'), R.keys(allKanji))).map(pinyin => {
//   let foundInStart = true
//   let [citiesWith, citiesWithout] = R.partition(city => city.country != 'CN' && city.name.toLowerCase().startsWith(pinyin), citiesBuff)
//   if (citiesWith.length <= 0) {
//     [citiesWith, citiesWithout] = R.partition(city => city.name.toLowerCase().startsWith(pinyin), citiesBuff)
//   }
//   if (citiesWith.length <= 0) {
//     foundInStart = false
//     [citiesWith, citiesWithout] = R.partition(city => city.name.toLowerCase().includes(pinyin), citiesBuff)
//   }

//   if (citiesWith.length <= 0) {
//     return [pinyin, null]
//   }

//   if (foundInStart) {
//     citiesBuff = citiesWithout
//     return [pinyin, citiesWith[0]]
//   } else {
//     // console.log({ x, citiesWithout })
//     let citiesWithFirst5 = citiesWith.slice(0, 1)
//     const citiesWithOther = citiesWith.slice(1)
//     citiesBuff = [...citiesWithOther, ...citiesWithout]
//     citiesWithFirst5 = citiesWithFirst5[0]

//     return [pinyin, citiesWithFirst5]
//   }
// }))
// output_ = R.mapObjIndexed((v, k) => R.pick('name country'.split(' '), v), output)

// require("i18n-iso-countries").registerLocale(require("i18n-iso-countries/langs/en.json"))

// pinyinToCountry = R.mapObjIndexed((x, pinyin) => {
//   if (!x) { return null }
//   const country = require("i18n-iso-countries").getName(x.country, "en", {select: "official"})
//   const name = x.name.replace(new RegExp(pinyin, "i"), pinyin.toUpperCase())
//   return { name, country, "1": "", "2": "", "3": "", "4": "", "5": "" }
// }, output)

// pinyinToCountry

// fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-countries.json', JSON.stringify(pinyinToCountry, null, 2))

// export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
// export PUPPETEER_EXECUTABLE_PATH=/nix/store/3pvqzg29lhyc0gh3hbfpymf7yganvni8-google-chrome-beta-88.0.4324.50/bin/google-chrome-beta
// node --experimental-repl-await --unhandled-rejections=strict

pinyinToCountry = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-countries.json').toString())

// const Scraper = require('images-scraper')
// const google = new Scraper({
//   puppeteer: {
//     headless: true,
//   },
// })
// promises = R.values(R.mapObjIndexed(
//   (v, k) => {
//     if (!v.name) { return null }
//     const place = `${v.country} ${v.name}`
//     return [
//       `${place} statue`,
//       `${place} museum`,
//       `${place} water`,
//       `${place} temple church`,
//       `${place} restaurant`,
//     ].map((q, i) => ({ i: i + 1, q, k }))
//   },
//   pinyinToCountry
// )).filter(R.identity).flat()
// mkQueue(1).addAll(
//   promises.map(({ i, k, q }) => async jobIndex => {
//     if (pinyinToCountry[k][i]) {
//       console.log({ m: "skipping", k, q, i })
//       return
//     }
//     const images = await google.scrape(q, 5)
//     console.log({ images, k, q, i })
//     pinyinToCountry[k][i] = images
//     fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-countries.json', JSON.stringify(pinyinToCountry, null, 2))
//   })
// )

// mapper = (v, k) => {
//   const print = (v_, linkContent) => {
//     if (v_.length <= 0) { return null }
//     const mark = v_[0].marked
//     const findHSK = n => v_.filter(x => x.purpleculture_hsk == n)
//     const printRow  = ([k, class_, v]) => {
//       if (v.length <= 0) { return null }
//       const key = nodeWith('span', { class: "key" }, k)
//       const val = v
//         .map(R.prop('kanji'))
//         .map(nodeWith('span', { class: ["kanji"] }))
//         .join(',')
//       return nodeWith('div', { class: ["row", `row-${class_}`] }, `${key}: ${val}`)
//     }
//     const printedValues = [
//       ["HSK 1", "hsk-1", findHSK(1)],
//       ["HSK 2", "hsk-2", findHSK(2)],
//       ["HSK 3", "hsk-3", findHSK(3)],
//       ["HSK 4", "hsk-4", findHSK(4)],
//       ["HSK 5", "hsk-5", findHSK(5)],
//       ["HSK 6", "hsk-6", findHSK(6)],
//       ["5000",  "5000", v_.filter(x => x.chinese_junda_freq_ierogliph_number <= 5000 && x.purpleculture_hsk === null)],
//       ["Other", "other", v_.filter(x => x.chinese_junda_freq_ierogliph_number > 5000 && x.purpleculture_hsk === null)],
//     ].map(printRow).filter(x => x != null)

//     // let image = pinyinToImageForTable[k][v_[0].number]
//     // image = [`<img src="file:///home/srghma/.local/share/Anki2/User 1/collection.media/mnemonic-places/${encodeURIComponent(image.dir)}/${encodeURIComponent(image.filename)}" alt="${image.filename.replace(/\.jpg/, '')}">`]

//     let images = []
//     // let images = pinyinToCountry[k][v_[0].number]
//     // if (Array.isArray(images)) {
//     //   images = images.map(x => `<a href="${x.source}" class="example-image"><img src="${x.url}" alt="${x.title || ''}"></a>`)
//     // } else {
//     //   images = []
//     // }

//     let head = mark
//     // head = nodeWith('a', { href: `https://www.google.com/search?tbm=isch&q=${linkContent.split(' ').map(encodeURIComponent).join('+')}`, target: "_blank" }, head)
//     head = nodeWith('span', { class: "marked" }, head)
//     return [head, ...printedValues, ...images].join('\n')
//   }
//   const find = n => v.filter(x => x.number == n)
//   let place = pinyinToCountry[k]
//   if (place) {
//     place = `${place.country} ${place.name}`
//   } else {
//     place = ''
//   }
//   return [
//     k,
//     // place,
//     print(find(1), `${place} statue`),
//     print(find(2), `${place} museum`),
//     print(find(3), `${place} water`),
//     print(find(4), `${place} temple church`),
//     print(find(5), `${place} restaurant`),
//   ]
// }
allKanji_ = R.values(R.mapObjIndexed(mapper, allKanjiForTable))

fileContent = `<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Table</title>
  <style>

  tr:nth-child(even) { background: #CCC; }
  tr:nth-child(odd) { background: #FFF; }
  td { vertical-align: top; }
  .row-other { display: none; }
  .example-image { display: block; }
  .example-image img { max-height: 200px; max-width: 200px; }
   @font-face {
    font-family: 'CNstrokeorder';
    src: url('file:///home/srghma/projects/anki-cards-from-pdf/CNstrokeorder.ttf');
  }
  @font-face {
    font-family: 'KanjiStrokeOrders';
    src: url('file:///home/srghma/projects/anki-cards-from-pdf/KanjiStrokeOrders.ttf');
  }
  .tooltips { font-size: 100px; font-family: "KanjiStrokeOrders", "CNstrokeorder"; }
  .kanji {
    font-family: "KanjiStrokeOrders", "CNstrokeorder";
    line-height: 1; font-size: 40px;
  }

  </style>
 </head><body><table>
   <tr>
    ${["1, ˉ", "2, ˊ", "3, ˇ", "4, ˋ", "5, ."].map(nodeWith('th', null)).join('\n')}
   </tr>
   ${t__.map(R.map(x => nodeWith('td', null, x || ''))).map(x => nodeWith('tr', null, x.join('  \n'))).join('\n')}
  </table>
 </body>
</html>`
fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/table.html', fileContent)
