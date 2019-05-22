
const request = require('request');

function downloadBiorxiv() {
    var parseXml = require('xml2js').parseString;

    request('http://connect.biorxiv.org/biorxiv_xml.php?subject=genomics', function (error, response, body) {

        console.log( body.substring(0,100) );

        parseXml( body, function (err, result) {
            
            console.log( result["rdf:RDF"].item[0].title );

        } );

    });
}