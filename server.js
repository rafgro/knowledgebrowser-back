const express = require('express'),
      server = express(),
      downloadBiorxivRss = require('./downloadBiorxivRss'),
      downloadArxivRss = require('./downloadArxivRss'),
      downloadChemrxivRss = require('./downloadChemrxivRss'),
      manager = require('./manager');

require('events').EventEmitter.prototype._maxListeners = 100;

server.set('port', process.env.PORT || 3000);

server.get('/', (request,response)=>{
  response.send('Home page');
});

server.get('/downloadChemrxiv', (request,response)=>{
  response.send('Started job');

  downloadChemrxivRss.start();

});

server.get('/downloadBiorxiv', (request,response)=>{
  response.send('Started job');

  downloadBiorxivRss.start();

});

server.get('/downloadArxiv', (request,response)=>{
  response.send('Started job');

  downloadArxivRss.start();

});

server.use((request,response)=>{
  response.type('text/plain');
  response.status(404);
  response.send('Error');
});

server.listen(3000, ()=>{
  console.log('Yea');
  manager.start();
});