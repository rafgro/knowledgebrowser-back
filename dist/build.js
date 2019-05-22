const express = require('express'),
      server = express();

server.set('port', process.env.PORT || 3000);

server.get('/', (request,response)=>{
  response.send('Home page');
});

server.get('/downloadBiorxiv', (request,response)=>{
  downloadBiorxiv();
  response.send('Started job');
});

server.use((request,response)=>{
  response.type('text/plain');
  response.status(404);
  response.send('Error');
});

server.listen(3000, ()=>{
  console.log('Yea');
});

const request = require('request');

function downloadBiorxiv() {
    var parseXml = require('xml2js').parseString;

    request('http://connect.biorxiv.org/biorxiv_xml.php?subject=genomics', function (error, response, body) {

        console.log( body.substring(0,100) );

        parseXml( body, function (err, result) {
            
            /*
{ 'rdf:RDF':
   { '$':
      { 'xmlns:admin': 'http://webns.net/mvcb/',
        xmlns: 'http://purl.org/rss/1.0/',
        'xmlns:rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'xmlns:prism': 'http://purl.org/rss/1.0/modules/prism/',
        'xmlns:taxo': 'http://purl.org/rss/1.0/modules/taxonomy/',
        'xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
        'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
        'xmlns:syn': 'http://purl.org/rss/1.0/modules/syndication/' },
     channel: [ [Object] ],
     image: [ [Object] ],
     item:
      [ [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object] ] } }
            */

        } );

    });
}