const express = require('express');
const proxy = require('http-proxy-middleware');
const cors = require('cors')
const fetchTags = require('./fetch-tags');
const cache = require('apicache').middleware;

const TRACKS_API_CALL_LIMIT = 10000;
const PORT = process.env.PORT || 3001;

const log = (...args) => console.log(...args);

const app = express();
app.use(cors());

const fbEmail = process.env.FB_EMAIL;
const fbPass = process.env.FB_PASS;

console.log(`fbEmail: ${fbEmail}`);
console.log(`fbPass lengt: ${fbPass.length}`);

app.get('/shazams.json', cache('1 day'), async (req, res) => {
  log('fetching tags');

  const tags = await fetchTags({
    fbEmail,
    fbPass,
    limit: TRACKS_API_CALL_LIMIT,
    debug: true
  });

  log('tags fetched');
  res.send(tags);
});


app.use('/api', proxy({
  target: 'https://cdn.shazam.com',
  changeOrigin: true,
}));

app.listen(PORT);

console.log('ready!');

process.on('unhandledrejection', rejection => {
  console.log('unhandled rejection caught');
  console.log(Object.keys(rejection));
  console.log(rejection);
});
