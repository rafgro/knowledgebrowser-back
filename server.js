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
server.get('/ops/indexArxiv', (request,response)=>{
  response.send('Started job');
  manager.start('arxiv');
});
server.get('/ops/indexBiorxiv', (request,response)=>{
  response.send('Started job');
  manager.start('biorxiv');
});
server.get('/ops/indexChemrxiv', (request,response)=>{
  response.send('Started job');
  manager.start('chemrxiv');
});

const {shiphold} = require('ship-hold');
/*const sh = shiphold({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
    database : 'postgres'
});*/
const sh = shiphold({
    host     : '127.0.0.1',
    user     : 'crawler',
    password : 'blackseo666',
    database : 'preprint-crawls'
});

/* API */
server.get('/api/search', (request,response)=>{

  let hrstart = process.hrtime();

  let query = request.query.q;

  sh.select('term','relevant').from('index_title').where('term','=',query)
    .run()
    .then(result => {

      let listOfIds = new Array();
      JSON.parse( result[0]["relevant"] ).forEach( element => {
        listOfIds.push( element.p.substring(1) );
      });
      
      sh.select('doi').from('arxiv').where('id','IN','('+listOfIds[0]+', '+listOfIds[1]+')').run()
      .then( results => {
        console.log(results);

        let hrend = process.hrtime(hrstart);
        response.send( result[0]["relevant"] + '<br/>' + 'Execution time (hr): '+hrend[0]+'s '+hrend[1] / 1000000 + 'ms' );

      })
      .catch(e=>{
        console.log(e);
      });
    })
    .catch(e=>{
      response.send( e );
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