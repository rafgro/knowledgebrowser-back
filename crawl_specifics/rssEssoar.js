
const logging = require('../logger');
const {shiphold} = require('ship-hold');
const striptags = require('striptags');

exports.processRssBody = function( sh, body ) {

    body["rdf:RDF"].item.forEach( element => {

        let nonDuplicated = false;

        sh.select('doi').from('content_preprints').where('doi','=',element["dc:identifier"])
        .run()
        .then(doi => {

            if( doi.length == 0 ) {
                nonDuplicated = true;
            }

            if( nonDuplicated == true ) {

                sh.insert({ 
                    link: element["prism:url"],
                    abstract: ' ',
                    authors: escape(element["dc:creator"].toString().replace(/\\\n/g,"")),
                    date: element["prism:coverDate"].toString().substring(0,18),
                    doi: element["dc:identifier"],
                    title: escape(element["dc:title"]),
                    server: 'ESSOAr' })
                .into('content_preprints')
                .run()
                .then(() => {
                    logger.info('Inserted '+element["dc:identifier"]+' / '+element["prism:coverDate"]);
                })
                .catch(e => {
                    logger.error(e.toString());
                });
            }

        })
        .catch(e => {
            logger.error(e.toString());
        });

    });

}