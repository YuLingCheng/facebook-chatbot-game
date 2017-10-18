const get = (statusCode, message, event) => {
  return response = {
    statusCode,
    body: JSON.stringify({
      message,
      input: event,
    }),
  };
}

module.exports = {
  get
}
