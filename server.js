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
server.get('/ops/index', (request,response)=>{
  response.send('Started job');
  manager.start();
});

/*const {shiphold} = require('ship-hold');
const sh = shiphold({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
    database : 'postgres'
});
const sh = shiphold({
    host     : '127.0.0.1',
    user     : 'crawler',
    password : 'blackseo666',
    database : 'preprint-crawls'
});*/

/* API */
/*server.get('/api/search', (request,response)=>{

  let hrstart = process.hrtime();

  let query = request.query.q;

  sh.select('term','relevant').from('index_title').where('term','=',query)
    .run()
    .then(result => {

      let listOfIds = { "a": new Array(), "b": new Array(), "c": new Array() };
      JSON.parse( result[0]["relevant"] ).forEach( element => {
        listOfIds[element.p.charAt(0)].push( element.p.substring(1) );
      });
      
      let test = sh.select('title','authors','date','abstract','link').from('arxiv').where('id','IN','('+listOfIds["a"][0]+')');

      let test2 = sh.select('title','authors','date','abstract','link').from('arxiv').where('id','IN','('+listOfIds["a"][1]+')');

      //test.text = '(' + test.text + ') UNION ALL (' + test2.text + ')';

      //sh.select('title','authors','date','abstract','link').from('arxiv').where('id','IN','('+listOfIds["a"].join(", ")+')')
      console.log( test );
      .then( results => {

        let hrend = process.hrtime(hrstart);
        response.send( { results, "execution": hrend[1] / 1000000 } );

      })
      .catch(e=>{
        console.log(e);
      });
      response.send("lol");

    })
    .catch(e=>{
      console.log( e );
    });
});*/

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