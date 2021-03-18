const arrayToRecordByPosition = (headers) => (x) => {
  buff = {}
  headers.forEach((h, i) => {
    buff[h] = x[i]
  })
  return buff
}

exports.arrayToRecordByPosition = arrayToRecordByPosition
