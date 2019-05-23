const express = require('express'),
      server = express(),
      downloadBiorxivRss = require('./downloadBiorxivRss');

server.set('port', process.env.PORT || 3000);

server.get('/', (request,response)=>{
  response.send('Home page');
});

server.get('/downloadBiorxiv', (request,response)=>{
  response.send('Started job');

  downloadBiorxivRss.start();


});

server.use((request,response)=>{
  response.type('text/plain');
  response.status(404);
  response.send('Error');
});

server.listen(3000, ()=>{
  console.log('Yea');
});