const arrayToRecordByPosition = require('./arrayToRecordByPosition').arrayToRecordByPosition

let convertToRuTable = R.map(arrayToRecordByPosition([
  'numbered',
  'marked',
  'bopomofo',
  '3',
  '4',
  '5',
  '6',
  'cased',
  'ru',
]), require('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-ru-by-kfcd.json'))

// delete require.cache['/home/srghma/projects/anki-cards-from-pdf/pinyin-to-ru-by-kfcd.json']

convertToRuTable = R.fromPairs(convertToRuTable.map(x => [x.marked.replace('·', ''), x.numbered]))

// convertToRuTable_ = R.uniq(R.toPairs(convertToRuTable).map(x => x[1].replace(/\d/, '')))

// errors = []
pinyin = {}
function purplecultureMarkedToNumbered(x, input) {
  const convertToRuTable_ = {
    ...convertToRuTable,
    'kēi':  'gei1',
    'kéi':  'gei2',
    'kěi':  'gei3',
    'kèi':  'gei4',
    'kei':  'gei5',
    'fiào': 'fiao4',
    'r':    'r',
    'xx':   'xx',
  }

  let output = convertToRuTable_[input]

  if (!output) {
    throw new Error(input)
    // errors.push({ x, input })
  }

  if (!pinyin[input]) {
    pinyin[input] = { output, ierogliphs: [] }
  }

  pinyin[input].ierogliphs.push(x.kanji)

  return output
}
