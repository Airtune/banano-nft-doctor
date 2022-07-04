const diagnose = require('./diagnose');
const fs = require('fs');

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const port = 4019;

const diagnoseHtml = fs.readFileSync('./public/diagnose.html');

app.get('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.write(diagnoseHtml);
  res.end();
});

app.post('/', async (req, res) => {
  console.log('diagnose');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.write(diagnoseHtml);
  res.write('<br><hr><br>');
  res.write("Please wait. Inspecting NFT API at: ");
  const diagnoseUrl = req.body.url;
  res.write(diagnoseUrl);
  res.write('<br><br>');
  const report = await diagnose('http://localhost:1919', res);
  res.write('<hr><p>')
  res.write(JSON.stringify(report, null, 4).split('\n').join('\n<br>\n'));
  res.end('</p>');
});

app.listen(port, () => {
  console.log(`Banano NFT doctor listening at port ${port}`);
});
