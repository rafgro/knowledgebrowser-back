require('stackify-node-apm');

const express = require('express'),
      server = express(),
      downloadBiorxivRss = require('./downloadBiorxivRss'),
      downloadArxivRss = require('./downloadArxivRss'),
      downloadChemrxivRss = require('./downloadChemrxivRss'),
      manager = require('./manager'),
      logging = require('./logger');

require('events').EventEmitter.prototype._maxListeners = 100;

server.set('port', process.env.PORT || 3000);

server.get('/', (request,response)=>{
  response.send('Home page');
});

/* Downloads */
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

/* Indexing */
server.get('/indexArxiv', (request,response)=>{
  response.send('Started job');
  manager.start('arxiv');
});
server.get('/indexBiorxiv', (request,response)=>{
  response.send('Started job');
  manager.start('biorxiv');
});
server.get('/indexChemrxiv', (request,response)=>{
  response.send('Started job');
  manager.start('chemrxiv');
});

/* Utils */
server.use((request,response)=>{
  response.type('text/plain');
  response.status(404);
  response.send('Error');
});

server.listen(3000, ()=>{
  logger.info('Listening');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at: '+reason+' | '+JSON.stringify(promise));
});