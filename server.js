const express = require('express');
const proxy = require('http-proxy-middleware');
const cors = require('cors')
const fetchTags = require('./fetch-tags');
const cache = require('apicache').middleware;

const TRACKS_API_CALL_LIMIT=10000;

const log = (...args) => console.log(...args);

const app = express();
app.use(cors());

const fbEmail = process.env.email;
const fbPass = process.env.password;

app.get('/shazams.json', cache('1 day'), async (req, res) => {
  log('fetching tags');

  const tags = await fetchTags({
    fbEmail,
    fbPass,
    limit: TRACKS_API_CALL_LIMIT,
  });

  log('tags fetched');
  res.send(tags);
});

app.use('/api', proxy({
  target: 'https://cdn.shazam.com',
  changeOrigin: true,
}));

app.listen(3001);
