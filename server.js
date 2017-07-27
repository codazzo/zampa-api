const express = require('express');
const proxy = require('http-proxy-middleware');
const cors = require('cors')
const fetchTags = require('./fetch-tags');
const cache = require('apicache').middleware;

const config = require('./config');
const TRACKS_API_CALL_LIMIT=10000;

const app = express();

app.use(cors());

app.get('/shazams.json', cache('1 day'), (req, res) => {
  var {fbEmail, fbPass} = req.query;

  console.log({fbEmail, fbPass});

  if (!fbEmail || !fbPass) {
    res.status(400).send('Missing query params');
    // fbEmail = config.fbEmail;
    // fbPass = config.fbPass;
  }

  fetchTags({
    fbEmail,
    fbPass,
    limit: TRACKS_API_CALL_LIMIT,
  }).then((data) => {
    res.send(data);
  });
});

app.use('/api', proxy({target: 'https://cdn.shazam.com', changeOrigin: true}));
app.listen(3001);

