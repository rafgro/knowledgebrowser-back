
const logging = require('./logger');
const request = require('request');
const striptags = require('striptags');

const {shiphold} = require('ship-hold');
const sh = shiphold({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
  database: 'postgres'
});

const date = new Date(Date.now());
const todaysDate = date.getFullYear() + (((date.getMonth()+1) < 10) ? "-0" : "-") + (date.getMonth()+1)
                + ((date.getDate() < 10) ? "-0" : "-") + date.getDate();

exports.start = function () {
    var parseXml = require('xml2js').parseString;

    var subjects = ["astro-ph", "cond-mat", "cs", "econ", "eess", "gr-qc", "hep-ex", "hep-lat", "hep-ph",
    "hep-th", "math", "math-ph", "nlin", "nucl-ex", "nucl-th", "physics", "q-bio", "q-fin", "quant-ph", "stat"];

    subjects.forEach( subject => {

        logger.info(subject);

        request('http://export.arxiv.org/rss/'+subject, {timeout: 20000}, function (error, response, body) {

        if( error ) {
            logger.error(error);
        }
        else {
            logger.info( body.substring(0,20) );

            parseXml( body, function (err, result) {
            
                result["rdf:RDF"].item.forEach(function(element) {

                    let nonDuplicated = false;

                    sh.select('doi').from('content_preprints').where('doi','=', "arXiv:"+(element["link"].toString().substring(21)) ).run()
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
                            .into('content_preprints')
                            .run()
                            .then(() => {
                                logger.info('Inserted '+"arXiv:"+(element["link"].toString().substring(21)));
                            })
                            .catch(e => {
                                logger.error(e);
                            });
                        }

                    })
                    .catch(e => {
                        logger.error(e);
                    });
                    
                });
    
            } );
        }

    });

    });
};