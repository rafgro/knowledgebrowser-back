const express = require('express'),
      server = express();

const mongoose = require('mongoose');
const publication = require('.././schemaPublication');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const connectDb = () => {
    return mongoose.connect("mongodb://localhost:27017/pcDev", { useNewUrlParser: true });
};

server.set('port', process.env.PORT || 3000);

server.get('/', (request,response)=>{
  response.send('Home page');
});

server.get('/downloadBiorxiv', (request,response)=>{
  response.send('Started job');

  downloadBiorxiv();

  connectDb().then(async () => {
    server.listen(27017, () =>
      console.log('Mongodb at port 27017'),
    );
  });

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
            
            /*console.log( result["rdf:RDF"].item[0].link );
            console.log( result["rdf:RDF"].item[0].description );
            console.log( result["rdf:RDF"].item[0]["dc:creator"] );
            console.log( result["rdf:RDF"].item[0]["dc:date"] );
            console.log( result["rdf:RDF"].item[0]["dc:identifier"] );
            console.log( result["rdf:RDF"].item[0]["dc:title"] );*/

        } );

    });
}