"use strict";

var get = function get(statusCode, message, event) {
  return {
    statusCode: statusCode,
    body: {
      message: message,
      input: event
    }
  };
};

module.exports = {
  get: get
};
