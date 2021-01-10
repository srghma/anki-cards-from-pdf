const parse = require('csv-parse')
const finished = require('stream').finished

// from https://github.com/adaltas/node-csv-parse/blob/master/samples/recipe.promises.js

exports._parse = function(options, readableStream) {
  return function (onError, onSuccess) {
    // console.log(input)

    arrayOfArrayOfString = []

    const parser = readableStream.pipe(parse(options));

    parser.on('readable', function(){
      let arrayOfString;

      while (arrayOfString = parser.read()) {
        // Work with each arrayOfString
        arrayOfArrayOfString.push(arrayOfString)
      }
    })

    const cleanup = finished(parser, function(err) {
      if (err) {
        onError(err);
      } else {
        onSuccess(arrayOfArrayOfString);
      }
    })

    return function (cancelError, onCancelerError, onCancelerSuccess) {
      cleanup();
      onCancelerSuccess();
    };
  };
};

