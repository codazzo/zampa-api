const path = require('path');
const puppeteer = require('puppeteer');
const replaceXHR = require('./replace-xhr');

const STORED_RESPONSE_VARIABLE_NAME = 'API_RESPONSE';

const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;
const TRACKS_API_CALL_REGEX = '\\?limit=\\d+';

const SHAZAM_PAGE_URL = 'https://www.shazam.com/myshazam';
const limit = 10000;
const FB_BUTTON_CLICK_RETRY_INTERVAL_MS = 500;
const INTERVAL_BEFORE_CLICKING_LOGIN_MS = 500;
const DEBUG_XHR = false;

const delay = intervalMs => new Promise(resolve => setTimeout(resolve, intervalMs));

module.exports = async ({
  limit = 10000,
  fbEmail,
  fbPass,
  debug = false,
}) => {
  const log = (...args) => debug && console.log(...args);

  const browser = await puppeteer.launch();
  const page = (await browser.pages())[0];

  await page.goto(SHAZAM_PAGE_URL);

  page.setViewport({
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
  });

  await page.evaluate(replaceXHR, TRACKS_API_CALL_REGEX, `?limit=${limit}`, STORED_RESPONSE_VARIABLE_NAME, DEBUG_XHR)
  log('XHR replaced');

  await page.evaluate(function() {
    const origOpen = window.open;
    window.open = function() {
      window.thePopup = origOpen.apply(this, arguments);
      return window.thePopup;
    }
  });
  log('window.open monkey-patched');

  await page.waitFor('.fblogin');
  log('login button available');

  await page.evaluate((intervalMs) => {
    const delay = intervalMs => new Promise(resolve => setTimeout(resolve, intervalMs));

    const dispatchClick = () => {
      const button = document.querySelector('.fblogin');
      const event = new PointerEvent('pointerup', {
         'view': window,
         'bubbles': true,
         'cancelable': true
       });
      button.dispatchEvent(event);
    };

    return (async () => {
      while (!window.thePopup) {
        await delay(intervalMs);
        dispatchClick();
      }
    })();
  }, FB_BUTTON_CLICK_RETRY_INTERVAL_MS);

  log('login button clicked');

  await (async () => {
    while ((await browser.pages()).length < 2) {
      log('waiting for popup page to be available')
      await delay(200);
    }
  })();

  const popupPage = (await browser.pages())[1];

  await popupPage.waitFor('input[name=email]');
  await popupPage.type('input[name=email]', fbEmail);
  await popupPage.type('input[name=pass]', fbPass);

  await delay(INTERVAL_BEFORE_CLICKING_LOGIN_MS);
  await popupPage.click('input[name=login]');

  await page.waitForFunction((varName) => window[varName], {}, STORED_RESPONSE_VARIABLE_NAME);

  const parsedData = await page.evaluate((varName) => JSON.parse(window[varName]), STORED_RESPONSE_VARIABLE_NAME);
  log(`data received. ${parsedData.tags.length} tracks.`);

  return parsedData;
};
