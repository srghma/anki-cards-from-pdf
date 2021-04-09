const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const removeHTML = require('./scripts/lib/removeHTML').removeHTML
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const purplecultureMarkedToNumbered = require('./scripts/lib/purplecultureMarkedToNumbered').purplecultureMarkedToNumbered
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
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
const nodeWith = require('./scripts/lib/nodeWith').nodeWith
toNumberOrNull = x => {
  if (!x) { return null }
  return Number(x) === 0 ? null : Number(x)
}

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))
input = input.map(x => ({ kanji: x.kanji, freq: Number(x._12) }))

freq = R.fromPairs(input.map(x => [x.kanji, x.freq]))

const queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
output = []
promises = input.map((x, inputIndex) => async jobIndex => {
  const kanji = x['kanji']
  console.log({ m: "doing", inputIndex, jobIndex, kanji })
  const dom = doms[jobIndex]
  if (!RA.isNonEmptyString(kanji)) { throw new Error('kanji') }
  if (!dom) { throw new Error('dom') }
  let translation = null
  try {
    translation = await require('./scripts/lib/purpleculture_dictionary').purpleculture_dictionary_with_cache(dom, kanji)
  } catch (e) {
    console.error({ m: "error", inputIndex, kanji, e })
    return
  }
  if (translation) {
    console.log({ m: "finished", jobIndex, inputIndex, length: input.length })
    output.push({ kanji, translation })
  }
})
await mkQueue(queueSize).addAll(promises)

output_ = output.filter(R.identity).map(x => {
  const removeIf = (x) => x && x.remove()
  let translation = x.translation
    .replace(/(href|src)="\//g, '$1="https://www.purpleculture.net/')
    .replace(/<div class="swordlist"><b>More: <\/b>.*?<\/div>/g, '')
    .replace(/<div><b>Example Words: <\/b><\/div>/g, '')
    .replace(/<div><b>English Definition: <\/b><\/div>/g, '')
    .replace(/<b>Pinyin: <\/b>/g, '')
    .replace(new RegExp('<div><b>Character Formation:</b></div>', 'g'), '')
    .replace(new RegExp('href="javascript:"', 'g'), '')
    .replace(new RegExp('title="loading..."', 'g'), '')
    .replace(new RegExp('title="Loading..."', 'g'), '')

  img = translation.match(/<br><img src="(.*?)" alt="Stroke order image for.*?>/)
  img = img && img[1]

  dom.window.document.body.innerHTML = translation

  const hskNode = dom.window.document.body.querySelector('label.hskbadge')
  const hsk = hskNode && hskNode.textContent.trim().replace(/HSK /, '')
  if (hskNode) { hskNode.remove() }

  const examples = mapWithForEachToArray(dom.window.document.body.querySelectorAll('.swordlist'), x => x.innerHTML)
  dom.window.document.body.querySelectorAll('.swordlist').forEach(e => e.remove())

  const treeNode = dom.window.document.body.querySelector('.tree')
  const tree = treeNode && treeNode.outerHTML
  if (treeNode) { treeNode.remove() }

  // elements.forEach(e => { e.remove() })
  // dom.window.document.body.querySelectorAll('.swordlist')

  pinyinsHTML = mapWithForEachToArray(dom.window.document.body.querySelectorAll('.pinyin'), x => x.outerHTML)
  pinyinsText = mapWithForEachToArray(dom.window.document.body.querySelectorAll('.pinyin'), x => x.textContent.trim())
  englishs = mapWithForEachToArray(dom.window.document.body.querySelectorAll('span.en'), x => x.textContent)

  dom.window.document.body.querySelectorAll('.pinyin').forEach(e => e.remove())
  dom.window.document.body.querySelectorAll('span.en').forEach(e => e.remove())

  if (pinyinsText.length !== pinyinsHTML.length || pinyinsHTML.length !== englishs.length) { throw new Error('adf') }

  pinyinWithHtml = R.zipWith((pinyinsHTML, englishs) => ({ pinyinsHTML, englishs }), pinyinsHTML, englishs)
  pinyinWithHtml = R.zipWith((obj, pinyinsText) => ({ ...obj, pinyinsText }), pinyinWithHtml, pinyinsText)

  pinyinWithoutMarks = R.uniq(pinyinsText.map(require('any-ascii')))

  removeIf(dom.window.document.body.querySelector('#char_ani_block'))
  removeIf(dom.window.document.body.querySelector('.charstr'))
  removeIf(dom.window.document.body.querySelector('#stroke_tool'))
  dom.window.document.body.querySelectorAll('.btn-group').forEach(e => e.remove())

  translation = dom.window.document.body.innerHTML
    .replace(/<br><img src=".*?" alt="Stroke order image for.*?>/g, '')
    .replace(new RegExp('<div class="py-2"><b>Step by Step Stroke Sequence:</b></div>', 'g'), '')
    .replace(new RegExp('<div style="line-height: 1.6;"></div>', 'g'), '')
    .replace(new RegExp('<div class="clearBoth"></div>', 'g'), '')

  return {
    kanji: x.kanji,
    purpleculture_dictionary_orig_transl: x.translation,
    translation,
    hsk,
    examples: examples.join('<br>'),
    tree,
    img,
    pinyinWithHtml,
    pinyinWithoutMarks,
  }
})

output__ = []
promises = output_.map((x, index) => async jobIndex => {
  if (x.pinyinWithHtml.length == 0) {
    output__.push(x)
    return
  }
  const dom = doms[jobIndex]
  let translationInput = x.pinyinWithHtml.map(x => x.englishs).map(x => x || '++++++++').join('\n')

  if (!translationInput) { return }

  translationInput = removeHTML(dom, translationInput)

  translation = await require('./scripts/lib/google_translate_with_cache').google_translate_with_cache(translationInput, { from: 'zh', to: 'ru' })
  translation = translation[0].split('\n')
  translation = translation.map(x => x.trim().replace('++++++++', ''))

  if (translation.length !== x.pinyinWithHtml.length) {
    console.log({
      m: 'error',
      ru_translation: translation,
      ...x
    })
    // output__.push(x)
    // return
    throw new Error(`${translation.length} != ${x.pinyinWithHtml.length}`)
  }
  const pinyinWithHtml = R.zipWith((pinyinWithHtmlEl, ru) => ({ ...pinyinWithHtmlEl, ru }), x.pinyinWithHtml, translation)
  // console.log({ m: 'finished', index, from: output_.length })
  output__.push({
    ...x,
    pinyinWithHtml,
  })
})
await mkQueue(queueSize).addAll(promises)

require('./scripts/lib/google_translate_with_cache').google_translate_sync()

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

const trainchinese_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/trainchinese_cache.json'
let trainchinese_cache = {}
try { trainchinese_cache = JSON.parse(fs.readFileSync(trainchinese_with_cache_path).toString()) } catch (e) {  }
trainchinese_cache_ = R.toPairs(trainchinese_cache).map(([kanji, transl]) => ({ kanji, transl }))
trainchinese_cache_ = trainchinese_cache_.filter(R.prop('transl'))
trainchinese_cache_ = trainchinese_cache_.map(({ kanji, transl }) => ({ kanji, transl: transl.filter(x => x.ch == kanji).filter(R.prop('transl')) })).filter(x => x.transl.length > 0)
trainchinese_cache_ = trainchinese_cache_.map(({ kanji, transl }) => ({ kanji, transl: transl.map(R.over(R.lensProp('transl'), x => x.replace(/\S+ \(фамилия\);?/g, '').trim())) })).filter(x => x.transl.length > 0)
trainchinese_cache_ = R.fromPairs(trainchinese_cache_.map(({ kanji, transl }) => ([kanji, transl])))

output__2 = output__.map(x => x.pinyinWithHtml.map(pinyinWithHtmlElem => ({ ...pinyinWithHtmlElem, ...(R.pick("hsk kanji".split(' '), x)) }))).flat()

mp3ToPinyinNumberAndOtherInfo = (x) => {
  x = Array.from(x.matchAll(/<a class="pinyin tone(\d+)\s*" href="https:\/\/www\.purpleculture\.net\/mp3\/([^\.]+)\.mp3">([^<]+)<\/a>/g))
  x = x.map(x => ({ number: toNumberOrNull(x[1]), numbered: x[2], marked: x[3] }))
  x = x.map(x => ({ ...x, withoutMark: x.numbered.replace(/\d+/g, '') }))
  return x[0]
}

const markHelp = x => {
  if (!x) { return '' }
  x = removeHTML(dom, x)
  x = x.trim().replace(/\[(\w+)\]/g, '<span class="purpleculture-english__pinyin-info">[$1]</span>')
  x = x.split('').map(x => {
    if (isHanzi(x)) { return `<span class="purpleculture-english__pinyin-info">${x}</span>` }
    return x
  }).join('')
  return x
}

output__2 = output__2.map(x => ({ ...x, ...(mp3ToPinyinNumberAndOtherInfo(x.pinyinsHTML)), englishs: markHelp(x.englishs), ru: markHelp(x.ru), hsk: toNumberOrNull(x.hsk), chinese_junda_freq_ierogliph_number: toNumberOrNull(freq[x.kanji]) }))

output__2 = output__2.map(x => {
  let trainchinese_cache_with_this_mark = trainchinese_cache_[x.kanji] || []
  // trainchinese_cache_with_this_mark = trainchinese_cache_with_this_mark.filter(y => y.pinyin == x.marked)
  return { ...x, trainchinese_cache_with_this_mark }
})

allKanjiForTable = R.groupBy(R.prop('withoutMark'), R.sortBy(R.prop('withoutMark'), output__2))

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
  return R.mapObjIndexed(
    (v, k) => {
      if (!v) { return null }

      const { marked, number, withoutMark } = v[0]

      const findHSK = n => v.filter(x => x.hsk == n)
      const hsks = [1, 2, 3, 4, 5, 6].map(findHSK).map(R.sortBy(R.prop('kanji')))

      let nonHSK6000 = v.filter(x => x.chinese_junda_freq_ierogliph_number <= 6000 && x.hsk === null)
      nonHSK6000 = R.sortBy(R.prop('kanji'), nonHSK6000)

      let other = v.filter(x => x.chinese_junda_freq_ierogliph_number > 6000 && x.hsk === null)
      other = R.sortBy(R.prop('kanji'), other)

      const front = [
        ["HSK 1", "hsk-1", hsks[0]],
        ["HSK 2", "hsk-2", hsks[1]],
        ["HSK 3", "hsk-3", hsks[2]],
        ["HSK 4", "hsk-4", hsks[3]],
        ["HSK 5", "hsk-5", hsks[4]],
        ["HSK 6", "hsk-6", hsks[5]],
        ["5000",  "5000", nonHSK6000],
      ].map(([k, class_, v]) => {
        if (v.length <= 0) { return null }
        const key = nodeWith('span', { class: "key" }, k)
        const val = v.map(v => {
          const trainchinese_cache_with_this_mark = v.trainchinese_cache_with_this_mark.map(x => {
            const pinyin = '<span class="trainchinese-pinyin">' + x.pinyin + '</span>'
            const type = '<span class="trainchinese-type">' + x.type + '</span>'
            const transl_____ = '<span class="trainchinese-transl">' + x.transl + '</span>'
            const res = pinyin + ': (' + type + ') ' + transl_____
            return `<div class="my-pinyin-trainchinese">${res}</div>`
          }).join('<br/>')

          return `<div class="my-pinyin-english">${v.englishs}</div><div class="my-pinyin-ru">${v.ru}</div>${trainchinese_cache_with_this_mark}`
        }).join(`\n<br><hr>`)
        return `${key}:\n<br><hr>${val}`
      }).filter(R.identity).join('<br>')

      const back = [
        ["HSK 1", "hsk-1", hsks[0]],
        ["HSK 2", "hsk-2", hsks[1]],
        ["HSK 3", "hsk-3", hsks[2]],
        ["HSK 4", "hsk-4", hsks[3]],
        ["HSK 5", "hsk-5", hsks[4]],
        ["HSK 6", "hsk-6", hsks[5]],
        ["5000",  "5000", nonHSK6000],
        ["Other", "other", other],
      ].map(([k, class_, v]) => {
        if (v.length <= 0) { return null }
        return `${k}: ${v.map(R.prop('kanji')).join('')}`
      }).filter(R.identity).join(`<br>`)

      return {
        marked,
        withoutMark,
        number,
        front,
        back,
      }
    },
    (R.groupBy(R.prop('number'), v))
  )
})

t___ = t__.flat().map(R.values).flat().filter(R.identity)

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(t___);
