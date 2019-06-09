const express = require('express'),
      server = express(),
      managerIndexing = require('./manager-indexing'),
      managerCrawling = require('./manager-crawling'),
      apiSearch = require('./apiSearch'),
      apiStats = require('./apiStats'),
      logging = require('./logger');

require('events').EventEmitter.prototype._maxListeners = 100;

server.set('port', process.env.PORT || 3000);

server.get('/', (request,response)=>{
  response.send('Home page');
});

/* Indexing */
server.get('/ops/index', (request,response)=>{
  response.send('Started job');
  managerIndexing.start();
});

/* Crawling */
server.get('/ops/discover', (request,response)=>{
  response.send('Started job');
  managerCrawling.start();
});

const {shiphold} = require('ship-hold');
const sh = shiphold({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
    database : 'postgres'
});
/*const sh = shiphold({
    host     : '127.0.0.1',
    user     : 'crawler',
    password : 'blackseo666',
    database : 'preprint-crawls'
});*/

/* API */
server.get('/api/search', (request,response)=>{

  let hrstart = process.hrtime();

  apiSearch.doYourJob( sh, request.query.q, 10, request.query.offset || 0, request.query.freshmode || 0 )
  .then( results => {
    let hrend = process.hrtime(hrstart);
    response.send( { "message": + hrend[1] / 1000000, "numberofall": results.numberofall, "results": results.results } );
    logger.info( "query: "+request.query.q );
  })
  .catch( e=> {
    response.send( { "message": JSON.stringify(e) } );
    logger.error(e);
  });

});

/* API */
server.get('/api/stats', (request,response)=>{

  apiStats.doYourJob( sh )
  .then( results => {
    response.send( results );
  })
  .catch( e=> {
    response.send( [ { "text": JSON.stringify(e) } ] );
  });

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