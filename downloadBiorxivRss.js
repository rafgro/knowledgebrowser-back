
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

        if( error ) {
            console.log( 'Not good' );
            console.log(error);
        }
        else {
            console.log( body.substring(0,100) );

            parseXml( body, function (err, result) {
            
                result["rdf:RDF"].item.forEach(function(element) {
                    console.log( element["dc:identifier"] );

                    let nonDuplicated = false;

                    sh.select('doi').from('biorxiv').where('doi','=',element["dc:identifier"]).run()
                    .then(doi => {

                        if( doi.length == 0 ) {
                            nonDuplicated = true;
                        }

                        if( nonDuplicated == true ) {

                            sh.insert({ 
                                link: element["link"].toString().replace("\n", ""),
                                abstract: "(\'" + escape(element["description"]) + "\')",
                                authors: escape(element["dc:creator"]),
                                date: element["dc:date"],
                                doi: element["dc:identifier"],
                                title: element["dc:title"] })
                            .into('biorxiv')
                            .run()
                            .then(() => {
                                console.log('Good');
                            })
                            .catch(e => {
                                console.log('Not good');
                                console.log(e);
                            });
                        }

                    })
                    .catch(e => {
                        console.log('Not good');
                        console.log(e);
                    });
                    
                });
    
            } );
        }

    });
};