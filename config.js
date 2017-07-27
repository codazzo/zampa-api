require('dotenv').config()

const fbEmail = process.env.FB_EMAIL;
const fbPass = process.env.FB_PASS;

if (!fbEmail || !fbPass) {
  throw new Error('Please set FB_EMAIL and FB_PASS in your environment');
}

module.exports = {
  fbEmail,
  fbPass,
};
