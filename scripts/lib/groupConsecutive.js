function groupConsecutive(fn, values) {
  const buffer = []
  let lastType = null
  let lastValues = []
  const lastIndex = values.length - 1
  values.forEach((value, index) => {
    const type = fn(value)
    if (index === 0) {
      lastType = type
      lastValues.push(value)
    } else {
      if (type === lastType) {
        lastValues.push(value)
      } else {
        buffer.push({ type: lastType, values: lastValues })
        lastType = type
        lastValues = []
        lastValues.push(value)
      }
    }
  })

  if (values.length !== 0) {
    buffer.push({ type: lastType, values: lastValues })
  }

  return buffer
}

function assert(input, expected) {
  const returned = groupConsecutive(x => x === 1, input)
  if (!R.equals(expected, returned)) {
    console.log(require('util').inspect(returned, {showHidden: false, depth: null, colors: true}))
    throw new Error('error')
  }
}

trSmall = { type: true, values: [1] }
flSmall = { type: false, values: [2] }
tr = { type: true, values: [1, 1] }
fl = { type: false, values: [2, 2] }

assert([], [])
assert([1], [trSmall])
assert([2], [flSmall])
assert([1, 1], [tr])
assert([2, 2], [fl])
assert([1,1,2,2,1,1,2,2], [tr, fl, tr, fl])
assert([2,2,1,1,2,2,1,1], [fl, tr, fl, tr])

exports.groupConsecutive = groupConsecutive
