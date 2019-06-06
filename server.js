const express = require('express'),
      server = express(),
      downloadBiorxivRss = require('./downloadBiorxivRss'),
      downloadArxivRss = require('./downloadArxivRss'),
      downloadChemrxivRss = require('./downloadChemrxivRss'),
      manager = require('./manager'),
      apiSearch = require('./apiSearch'),
      logging = require('./logger');

require('events').EventEmitter.prototype._maxListeners = 100;

server.set('port', process.env.PORT || 3000);

server.get('/', (request,response)=>{
  response.send('Home page');
});

/* Downloads */
server.get('/ops/downloadChemrxiv', (request,response)=>{
  response.send('Started job');
  downloadChemrxivRss.start();
});
server.get('/ops/downloadBiorxiv', (request,response)=>{
  response.send('Started job');
  downloadBiorxivRss.start();
});
server.get('/ops/downloadArxiv', (request,response)=>{
  response.send('Started job');
  downloadArxivRss.start();
});

/*server.get('/debug', (request,response)=>{
  let fs = require('fs');
  let filename = "stackify-debug.log";
  let content = fs.readFileSync(process.cwd() + "/" + filename).toString();
  response.send(content);
});*/

/* Indexing */
server.get('/ops/index', (request,response)=>{
  response.send('Started job');
  manager.start();
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

  apiSearch.doYourJob( sh, request.query.q, 10, request.query.offset || 0 )
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