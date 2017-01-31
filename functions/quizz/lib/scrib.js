module.exports = {
  getImageMsg : function (url) {
    return {
      attachment: {
        type: 'image',
        payload: {
          url: url
        }
      }
    };
  },

  getMsgWithButtons: function (msg, buttons) {
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: msg,
          buttons: buttons
        }
      }
    };
  },

  getButton: function (label, action) {
    return {
      type: 'postback',
      title: label,
      payload: action
    };
  },

  getQuickReply: function (label, action) {
    return {
      content_type: 'text',
      title: label,
      payload: action
    };
  },

  getMsgWithHelpers: function (msg, helpers) {
    return {
      text: msg,
      quick_replies: helpers
    };
  }
};