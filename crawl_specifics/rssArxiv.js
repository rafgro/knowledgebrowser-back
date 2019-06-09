
const logging = require('../logger');
const {shiphold} = require('ship-hold');
const striptags = require('striptags');

exports.processRssBody = function( sh, body ) {

    body["rdf:RDF"].item.forEach( element => {

        let nonDuplicated = false;
        let id = "arXiv:"+(element["link"].toString().substring(21));

        sh.select('doi').from('content_preprints').where('doi','=',id)
        .run()
        .then(doi => {

            if( doi.length == 0 ) {
                nonDuplicated = true;
            }

            if( nonDuplicated == true ) {

                let hour = (new Date).getUTCHours();
                let date = new Date(Date.now());
                let myDate = ''; //format: 2019-06-04 08:00:00
                if( hour < 10 ) { myDate = date.getUTCFullYear() + (((date.getUTCMonth()+1) < 10) ? "-0" : "-") + (date.getUTCMonth()+1)
                + ((date.getUTCDate() < 10) ? "-0" : "-")+date.getUTCDate()+' 0'+hour+':00:00'; }
                else { myDate = date.getUTCFullYear() + (((date.getUTCMonth()+1) < 10) ? "-0" : "-") + (date.getUTCMonth()+1)
                + ((date.getUTCDate() < 10) ? "-0" : "-")+date.getUTCDate()+' '+hour+':00:00'; }

                sh.insert({ 
                    link: element["link"],
                    abstract: "(\'" + escape(striptags(element["description"][0]["_"])) + "\')",
                    authors: escape(striptags(element["dc:creator"].toString())),
                    date: myDate,
                    doi: id,
                    title: escape(element["title"]) })
                .into('content_preprints')
                .run()
                .then(() => {
                    logger.info('Inserted '+id+' / '+myDate);
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