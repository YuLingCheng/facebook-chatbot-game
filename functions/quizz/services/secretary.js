'use strict';

module.exports = {
  getImageMsg: function getImageMsg(url) {
    return {
      attachment: {
        type: 'image',
        payload: {
          url: url
        }
      }
    };
  },

  getMsgWithButtons: function getMsgWithButtons(msg, buttons) {
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

  getButton: function getButton(label, action) {
    return {
      type: 'postback',
      title: label,
      payload: action
    };
  },

  getQuickReply: function getQuickReply(label, action) {
    return {
      content_type: 'text',
      title: label,
      payload: action
    };
  },

  getMsgWithHelpers: function getMsgWithHelpers(msg, helpers) {
    return {
      text: msg,
      quick_replies: helpers
    };
  }
};
