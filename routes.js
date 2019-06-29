const { Router, Request, Response } = require('express');
const loader = require('./loaders');
const managerCrawling = require('./jobmanagers/manager-crawling');
const managerIndexing = require('./jobmanagers/manager-indexing');
const managerCorrecting = require('./jobmanagers/manager-correcting');
const apiSearch = require('./api/search');
const apiStatsPublic = require('./api/stats/public');
const apiStatsInternal = require('./api/stats/internal');

const server = Router();

/* operations */
server.get('/ops/discover', (request,response)=>{
  response.send('Started job');
  managerCrawling.start();
});
server.get('/ops/index', (request,response)=>{
  response.send('Started job');
  managerIndexing.start();
});
server.get('/ops/correct', (request,response)=>{
  response.send('Started job');
  managerCorrecting.start();
});

/* api */
server.get('/api/search', (request,response)=>{
  let hrstart = process.hrtime();
  apiSearch.doYourJob( loader.database, request.query.q, 10, request.query.offset || 0, request.query.stats || 1 )
  .then( results => {
    let hrend = process.hrtime(hrstart);
    logger.info('Responded to '+request.query.q+' with offset '+request.query.offset || 0);
    response.send( { "message": + hrend[1] / 1000000, "numberofall": results.numberofall, "results": results.results } );
  })
  .catch( e=> {
    logger.error(e);
    logger.error('request: '+JSON.stringify(request.query));
    response.send( e );
  });
});
server.get('/api/stats', (request,response)=>{
  apiStatsPublic.doYourJob( loader.database )
  .then( results => {
    response.send( results );
  })
  .catch( e=> {
    logger.error(e);
    response.send( [ { "text": JSON.stringify(e) } ] );
  });
});
server.get('/api/stats2', (request,response)=>{
  apiStatsInternal.doYourJob( loader.database )
  .then( results => {
    response.send( results );
  })
  .catch( e=> {
    logger.error(e);
    response.send( [ { "text": JSON.stringify(e) } ] );
  });
});

// Http errors
server.use((request,response)=>{
    response.type('text/plain');
    response.status(404);
    response.send('Error');
});

exports.routesServer = server;