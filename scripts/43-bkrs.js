const readStreamArray = require('./lib/readStreamArray').readStreamArray
const removeHTML = require('./lib/removeHTML').removeHTML
const checkDuplicateKeys = require('./lib/checkDuplicateKeys').checkDuplicateKeys
const purplecultureMarkedToNumbered = require('./lib/purplecultureMarkedToNumbered').purplecultureMarkedToNumbered
const isHanzi = require('./lib/isHanzi').isHanzi
const mkQueue = require('./lib/mkQueue').mkQueue
const mapWithForEachToArray = require('./lib/mapWithForEachToArray').mapWithForEachToArray
const arrayToRecordByPosition = require('./lib/arrayToRecordByPosition').arrayToRecordByPosition
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});
const nodeWith = require('./lib/nodeWith').nodeWith
const toNumberOrNull = str => { if (!str) { return null }; var num = parseFloat(str); if (isFinite(num)) { return num; } else { return null; }; }
const checkSameLength = (x, y) => { if (x.length != y.length) { throw new Error(`x.length (${x.length}) != y.length (${y.length})`) } }
const zipOrThrowIfNotSameLength = (x, y) => { checkSameLength(x, y); return R.zip(x, y); }

// dictionary = await require('harlaw').toArray('/home/srghma/Downloads/dabkrs_v86_5/5parts/大БКРС_v86_1.dsl')

// d = '/home/srghma/Downloads/dabkrs_v86_5/大БКРС_v86.dsl'
// d = '/home/srghma/Downloads/dabkrs_v86_5/5parts/大БКРС_v86_1.dsl'

xOrig = fs.readFileSync('/home/srghma/Downloads/dabkrs_v86_5/5parts/dabkrs_v86_1/大БКРС_v86.dsl', 'utf-16le').toString().split('\n')
x = xOrig.slice(4)

let b = []
let curr = []
x.forEach(xi => {
  if (xi === '') {
    b.push(curr)
    curr = []
    return
  }
  curr.push(xi)
})
// x = R.splitEvery(4, x)

replaces = [
  { search: '[b]',    replace: '<strong>' },
  { search: '[/b]',   replace: '</strong>' },
  { search: '[i]',    replace: '<i>' },
  { search: '[/i]',   replace: '</i>' },
  { search: '[p]',    replace: '<span>' },
  { search: '[/p]',   replace: '</span>' },
  { search: '{-}',    replace: '-' },
  { search: '[ref]',  replace: '<span class="reference">' },
  { search: '[/ref]', replace: '</span>' },
  { search: '[m]',    replace: '<div>' },
  { search: '[m1]',   replace: '<div>' },
  { search: '[m2]',   replace: '<div>' },
  { search: '[m3]',   replace: '<div>' },
  { search: '[m4]',   replace: '<div>' },
  { search: '[m5]',   replace: '<div>' },
  { search: '[m6]',   replace: '<div>' },
  { search: '[m7]',   replace: '<div>' },
  { search: '[m8]',   replace: '<div>' },
  { search: '[m9]',   replace: '<div>' },
  { search: '[m10]',  replace: '<div>' },
  { search: '[/m]',   replace: '</div>' },
  { search: '[*]',    replace: '<ul>' },
  { search: '[/*]',   replace: '</ul>' },
  { search: '[ex]',   replace: '<li>' },
  { search: '[/ex]',  replace: '</li>' },
  { search: '[c]',    replace: '' },
  { search: '[/c]',   replace: '' },
]

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function fixTransl(t) {
  replaces.forEach(({ search, replace }) => {
    t = t.replace(new RegExp(escapeRegExp(search), 'g'), replace)
  })

  return t
}

output = b.filter(R.identity).map(([k, p, tr]) => ({ k, p: p.trim(), tr: tr.trim() }))
output = output.filter(x => x.k.length == 1)
output = output.filter(x => !'αδγ'.includes(x.k))
output = output.map(x => ({ ...x, tr: fixTransl(x.tr) }))

// output = R.groupBy(R.prop('k'), output)
// R.values(output).filter(x => x.length !== 1)
// output = R.omit('α δ γ'.split(' '), output)

// await require('harlaw').toJson(d, `/home/srghma/Downloads/dabkrs_v86_5/output.json`, require('harlaw').noMarkupSettings)

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output);
