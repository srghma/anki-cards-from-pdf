stringify = require('csv-stringify')

exports._stringify = function(input) {
  return function (onError, onSuccess) {
    // console.log(input)

    stringify(input, function (err, res) {
      // console.log(err, res)

      if (err) {
        onError(err);
      } else {
        onSuccess(res);
      }
    });

    return function (cancelError, onCancelerError, onCancelerSuccess) {
      onCancelerSuccess();
    };
  };
};

