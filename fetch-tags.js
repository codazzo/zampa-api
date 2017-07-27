const path = require('path');
const Horseman = require('node-horseman');
const replaceXHR = require('./replace-xhr');

const STORED_RESPONSE_VARIABLE_NAME = 'API_RESPONSE';
const PEP_POLYFILL_PATH = path.join(__dirname, 'polyfills', 'pep.js');
const horseman = new Horseman({
  injectJquery: false,
  timeout: 15000
});

const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;
const TRACKS_API_CALL_REGEX = '\\?limit=\\d+';

module.exports = function fetchTags({
  limit,
  fbEmail,
  fbPass
}) {
  return new Promise((resolve) => {
    horseman
      .on('consoleMessage', function(msg) {
        console.log(`[console] ${msg}`);
      })
      .open('https://www.shazam.com/myshazam')
      .injectJs(PEP_POLYFILL_PATH)
      .viewport(VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
      .evaluate(replaceXHR, TRACKS_API_CALL_REGEX, `?limit=${limit}`, STORED_RESPONSE_VARIABLE_NAME)
      .evaluate(function() {
        var origOpen = window.open;

        console.info('monkey patching window.open');

        window.open = function() {
          console.log('window.open being called');
          window.thePopup = origOpen.apply(this, arguments);

          console.log(window.thePopup);
          return window.thePopup;
        }
      })
      .waitForSelector('.fblogin')
      .then(function() {
        console.log('Facebook Login Button available');
      })
      .evaluate(function() {
        var button = document.querySelector('.fblogin');
        var event = new PointerEvent('pointerup', {
           'view': window,
           'bubbles': true,
           'cancelable': true
         });
        button.dispatchEvent(event);
      })
      .switchToTab(0)
      .waitFor(function() {
        return typeof window.thePopup !== 'undefined';
      }, true)
      .switchToTab(1)
      .value('input[name=email]', fbEmail)
      .value('input[name=pass]', fbPass)
      .click('input[name=login]')
      .then(function() {
        console.log('Form filled');
      })
      .switchToTab(0)
      .waitFor(function() {
        return window.thePopup.closed;
      }, true)
      .waitFor(function(varName) {
        return typeof window[varName] !== 'undefined';
      }, STORED_RESPONSE_VARIABLE_NAME, true)
      .evaluate(function(varName) {
        return window[varName];
      }, STORED_RESPONSE_VARIABLE_NAME)
      .then(function(data){
          console.log('Data received.');
          const parsedData = JSON.parse(data);
          console.log(parsedData.tags.length);
          resolve(parsedData);
      })
      .close();
  });
}
