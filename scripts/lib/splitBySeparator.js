const R = require('ramda')

function splitBySeparator(isSeparatorFn, values) {
  const buffer = []
  let currentChunk = []
  let previousElementWasSeparator = false

  values.forEach((value, index) => {
    const isSeparator = isSeparatorFn(value)

    // console.log({ value, previousElementWasSeparator, isSeparator, currentChunk, buffer })

    if (index === 0) {
      currentChunk.push(value)
      return
    }

    if (isSeparator) {
      if (previousElementWasSeparator) {
        currentChunk.push(value)
      } else {
        currentChunk.push(value)
      }
    } else {
      if (previousElementWasSeparator
      && !R.all(x => isSeparatorFn(x), currentChunk)
      ) {
        buffer.push(currentChunk)
        currentChunk = []
      }
      currentChunk.push(value)
    }

    previousElementWasSeparator = isSeparator

    // if (isSeparator) {
    //   currentChunk.push(value)
    //   if (currentChunk.some(element => !isSeparator(element))) {
    //     buffer.push(currentChunk)
    //     currentChunk = []
    //   }
    // } else {
    //   currentChunk.push(value)
    // }
  })

  if (currentChunk.length !== 0) {
    buffer.push(currentChunk)
  }

  return buffer
}

function assert(input, expected) {
  input = [...input]
  expected = expected.map(x => [...x])
  const returned = splitBySeparator(x => x === ',', input)
  if (!R.equals(expected, returned)) {
    console.log(require('util').inspect(returned, {showHidden: false, depth: null, colors: true}))
    throw new Error('error')
  }
}

assert('', [])
assert('1', ['1'])
assert('11,,', ['11,,'])
assert('11,11', ['11,', '11'])
assert('11,11,', ['11,', '11,'])
assert('11,11,,', ['11,', '11,,'])
assert('11,11,,', ['11,', '11,,'])
assert(',,11,,11,,', [',,11,,', '11,,'])

exports.splitBySeparator = splitBySeparator
