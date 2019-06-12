
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

                let hour = (new Date).getUTCHours();
                let myDate = ''; //format: 2019-06-04 08:00:00
                if( hour < 10 ) myDate = element["dc:date"]+' 0'+hour+':00:00';
                else myDate = element["dc:date"]+' '+hour+':00:00';

                sh.insert({ 
                    link: element["link"].toString().replace("\n", ""),
                    abstract: "(\'" + escape(element["description"]) + "\')",
                    authors: escape(element["dc:creator"]),
                    date: myDate,
                    doi: element["dc:identifier"],
                    title: escape(element["dc:title"]),
                    server: 'bioRxiv' })
                .into('content_preprints')
                .run()
                .then(() => {
                    logger.info('Inserted '+element["dc:identifier"]+' / '+myDate);
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

}