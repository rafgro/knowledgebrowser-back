
const request = require('request');

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

        } );

    });
};