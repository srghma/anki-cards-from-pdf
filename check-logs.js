// /home/srghma/Downloads/vd-rails-logs

// gzip -d production.log.1.gz
// gzip -d production.log.2.gz
// gzip -d production.log.3.gz
// gzip -d production.log.4.gz
// gzip -d production.log.5.gz
// gzip -d production.log.6.gz
// gzip -d production.log.7.gz

const fs = require('fs');
const readline = require('readline');
const parseISO = require('date-fns/parseISO')
const R = require('ramda')

files = [
  // '/home/srghma/Downloads/vd-rails-logs/production.log.1', // from 2022-10-19 04:02:43 +0000 to 2022-10-19 18:33:11 +0000
  // '/home/srghma/Downloads/vd-rails-logs/production.log.2', // from 2022-10-18 04:02:10 +0000 to 2022-10-19 04:00:22 +0000
  '/home/srghma/Downloads/vd-rails-logs/production.log.3', // from 2022-10-17 04:05:03 +0000 to 2022-10-18 04:01:39 +0000
  // '/home/srghma/Downloads/vd-rails-logs/production.log.4', // from 2022-10-16 04:02:50 +0000 to 2022-10-17 04:05:00 +0000
  // '/home/srghma/Downloads/vd-rails-logs/production.log.5',
  // '/home/srghma/Downloads/vd-rails-logs/production.log.6',
  // '/home/srghma/Downloads/vd-rails-logs/production.log.7',
]

output = files
// output = files.slice(0, 1)
output = output.map(async x => {
  const fileStream = fs.createReadStream(x);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  const buffer = []
  for await (const line of rl) {
    // SQL (152442.1ms)  WITH
    // publications_ AS (
    // SELECT
    //   publications.*
    let text = Array.from(line.matchAll(/D, \[(\S+) [^\]]+\].+\[([^\]]+)\].*SQL \((.+)ms\)/gi))[0]
    // console.log(text)
    if (text) {
      const [_x, timedate, id, worktime] = text
      // 2022-10-19T04:02:43.194475
      // to
      // 2022-10-19T04:02:00.000000
      // const date = parseISO(timedate.replace(/..\.......$/, '00.000000')).getTime()
      // const date = parseISO(timedate)
      buffer.push({ timedate, id, worktime })
      // if (buffer.hasOwnProperty(date)) {
      //   buffer[date] = buffer[date] + 1
      // } else {
      //   buffer[date] = 1
      // }
      // break
    }
  }
  return buffer
})
output = await Promise.all(output)

// output2 = R.reduce(R.mergeWith((left, right) => left + right), {}, output)
// output2 = R.toPairs(output2).map(([date,count]) => [Number(date),count])
// output2 = R.sortBy(R.prop(0), output2)

output2 = output[0]
output2 = output2.map(({ timedate, id, worktime }) => ({ date: Number(parseISO(timedate.replace(/......$/, '000000')).getTime()), worktime: Number(worktime) }))
output2 = output2.map(({ date, worktime }) => [date, worktime])
output2 = R.sortBy(R.prop(0), output2)
fs.writeFileSync('./check-logs-data.json',JSON.stringify(output2,undefined,2))
