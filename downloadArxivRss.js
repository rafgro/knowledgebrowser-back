
const request = require('request');
const striptags = require('striptags');

const {shiphold} = require('ship-hold');
const sh = shiphold({
  hostname: '127.0.0.1',
  user: 'crawler',
  password: 'blackseo666',
  database: 'preprint-crawls'
});

const date = new Date(Date.now());
const todaysDate = date.getFullYear() + (((date.getMonth()+1) < 10) ? "-0" : "-") + (date.getMonth()+1)
                + ((date.getDate() < 10) ? "-0" : "-") + date.getDate();

exports.start = function () {
    var parseXml = require('xml2js').parseString;

    var subjects = ["astro-ph", "cond-mat", "cs", "econ", "eess", "gr-qc", "hep-ex", "hep-lat", "hep-ph",
    "hep-th", "math", "math-ph", "nlin", "nucl-ex", "nucl-th", "physics", "q-bio", "q-fin", "quant-ph", "stat"];

    subjects.forEach( subject => {

        console.log(subject);

        request('http://export.arxiv.org/rss/'+subject, {timeout: 20000}, function (error, response, body) {

        if( error ) {
            console.log( 'Not good' );
            console.log(error);
        }
        else {
            //console.log( body.substring(0,100) );

            parseXml( body, function (err, result) {
            
                result["rdf:RDF"].item.forEach(function(element) {

                    let nonDuplicated = false;

                    sh.select('doi').from('arxiv').where('doi','=', "arXiv:"+(element["link"].toString().substring(21)) ).run()
                    .then(doi => {

                        if( doi.length == 0 ) {
                            nonDuplicated = true;
                        }

                        if( nonDuplicated == true ) {

                            sh.insert({ 
                                link: element["link"],
                                abstract: "(\'" + escape(element["description"][0]["_"]) + "\')",
                                authors: escape(striptags(element["dc:creator"].toString())),
                                date: todaysDate,
                                doi: "arXiv:"+(element["link"].toString().substring(21)),
                                title: escape(element["title"]) })
                            .into('arxiv')
                            .run()
                            .then(() => {
                                console.log('Inserted');
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

    });
};