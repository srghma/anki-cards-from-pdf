// ./node_modules/.bin/babel-node --config-file ./babel.config.js scripts/40-pdf-with-sounds-for-notes.js
const R = require('ramda')
// import React from 'react'
// import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'
// import ReactPDF from '@react-pdf/renderer'

let t = `a	ai	ao	an	ang	e	ei	en	eng	er	o	ou		yi		ya	yao	ye	you	yan	yang	yin	ying	yong	wu	wa	wai	wei	wo	wan	wang	wen	weng	yu	yue	yuan	yun
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

t = t.split('\n').map(R.trim()).filter(R.identity).map(line => ({ s: line[0], lines: R.split('\t', line).flat().flat().filter(R.identity) }))

const PDFDocument = require('pdfkit');
const fs = require('fs');

// Create a document
const doc = new PDFDocument();
const { outline } = doc;

// Pipe its output somewhere, like to a file or HTTP response
// See below for browser usage
doc.pipe(fs.createWriteStream(`${process.cwd()}/chinese-table-of-sounds.pdf`));

t.forEach(({ s, lines }, sIndex) => {
  const top = outline.addItem(s);

  lines.forEach((line, lineIndex) => {
    doc
      .font('fonts/PalatinoBold.ttf')
      .fontSize(13)
      .text(line, 10, 10);

    const types = "ˉ ´ ˉ `".split(' ')

    types.forEach((type, lineIndex) => {
      doc
        .font('fonts/PalatinoBold.ttf')
        .fontSize(20)
        .text(type, 70 + 150 * lineIndex, 30);
    })

    // const isFirstPage = lineIndex == 0
    const isSLastPage = sIndex == t.length - 1
    const isLastPage = lineIndex == lines.length - 1

    top.addItem(line);

    if (!(isSLastPage && isLastPage)) {
      doc.addPage({
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }
      })
    }
  })
})
doc.end();
