"use strict";

var get = function get(statusCode, message, event) {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: message,
      input: event
    })
  };
};

module.exports = {
  get: get
};
