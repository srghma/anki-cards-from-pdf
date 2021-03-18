const arrayToRecordByPosition = require('./arrayToRecordByPosition').arrayToRecordByPosition
const R = require('ramda')
const RA = require('ramda-adjunct')

let convertToRuTable = R.map(arrayToRecordByPosition([
  'numbered',
  'marked',
  'bopomofo',
  '3',
  '4',
  '5',
  '6',
  'cased',
  'AA',
  'ru',
]), require('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-ru-by-kfcd.json'))

// delete require.cache['/home/srghma/projects/anki-cards-from-pdf/pinyin-to-ru-by-kfcd.json']

convertToRuTable = R.fromPairs(convertToRuTable.map(x => [
  x.numbered.replace(/\d+/g, ''),
  x.ru.replace('¹', '').replace('²', '').replace('³', '').replace('⁴', '').replace('⁵', '')
]))

convertToRuTable = {
  ...convertToRuTable,
  'fiao': 'фяо',
  'xx':   'xx',
  'kei':  'кеи',
  'lve':  'люэ',
  'nve':  'нюэ',
  'r':    'r',
}

exports.convertToRuTable = convertToRuTable
