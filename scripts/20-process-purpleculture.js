purplecultureWords = require('fs').readFileSync('/home/srghma/projects/anki-cards-from-pdf/ipa-output/purpleculture-words-output.txt').toString().split('\n').map(x => x.trim()).flat().filter(x => x != '')

purplecultureWords = purplecultureWords.map(x => {
  const o = x.match(/(\S+)\((.+?)\)/g)
  if(R.any(R.isEmpty, o)) { console.log(x); throw new Error('asdf') }
  return o
}).flat().map(x => x.match(/(\S+)\((.+?)\)/)).map(x => ({ ch: x[1], tr: x[2] }))
