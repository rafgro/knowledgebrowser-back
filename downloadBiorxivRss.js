
const request = require('request');

const {shiphold} = require('ship-hold');
const sh = shiphold({
  hostname: '127.0.0.1',
  user: 'crawler',
  password: 'blackseo666',
  database: 'preprint-crawls'
});

exports.start = function () {
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
            sh.insert({ 
                    link: result["rdf:RDF"].item[0]["link"].toString().replace("\n", ""),
                    abstract: "(\'" + result["rdf:RDF"].item[0]["description"].toString().replace("\n", "") + "\')",
                    authors: result["rdf:RDF"].item[0]["dc:creator"],
                    date: result["rdf:RDF"].item[0]["dc:date"],
                    doi: result["rdf:RDF"].item[0]["dc:identifier"],
                    title: result["rdf:RDF"].item[0]["dc:title"] })
                .into('biorxiv')
                .run()
                .then(() => {
                    console.log('Good');
                })
                .catch(e => {
                    console.log('Not good');
                    console.log(e);
                })
                .finally(() => {
                    sh.stop();
                });

        } );

    });
};