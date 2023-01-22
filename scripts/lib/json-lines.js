const jsonlines = require('@jsonlines/core')
const path      = require('path')
const fs        = require('fs')
const fsPromise = require('fs/promises')

exports.createJsonLFileStream = function createJsonLFileStream(dataFilePath) {
  const source = fs.createReadStream(dataFilePath);
  const parser = jsonlines.parse({ emitInvalidLines: true });
  const dataStream = source.pipe(parser);
  return dataStream;
}

exports.parseJSONPerLineFormat = async function parseJSONPerLineFormat(path) {
  parseStream = createJsonLFileStream(path)
  const buffer = []
  // parseStream.on("data", (value) => {
  //   if (value === require("@jsonlines/core/null-value").nullValue) { throw new Error('--- The following value is nullValue ---') }
  //   buffer.push(value)
  // })
  for await (const v of parseStream) {
    buffer.push(v)
  }
  // await parseStream.once(rl, 'close')
  return buffer
}

exports.createJsonLFileWriteStream = function createJsonLFileWriteStream(dataFilePath) {
  createFilesDirIfNotExists(dataFilePath);
  var stringifier = jsonlines.stringify();
  const destStream = fs.createWriteStream(dataFilePath);
  stringifier.pipe(destStream);
  return stringifier;
}

function createFilesDirIfNotExists(filename) {
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function isValidZip(path) {
  if (!path.endsWith('.zip')) {
    throw new Error('invalid file type, use zip');
  }
  try {
    await fsPromise.access(path);
  } catch (error) {
    console.error(error);
    throw new Error(`import file not found or inaccessible. path ${path}`);
  }
}
