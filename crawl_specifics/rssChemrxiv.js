
const logging = require('../logger');
const {shiphold} = require('ship-hold');
const striptags = require('striptags');

exports.processRssBody = function( sh, body ) {

    body.rss.channel[0].item.forEach( element => {

        let chemrxivDoi = "chemRxiv:"+element["link"].toString().substring(element["link"].toString().lastIndexOf("/")+1);
        let nonDuplicated = false;

        sh.select('doi').from('content_preprints').where('doi','=',chemrxivDoi)
        .run()
        .then(doi => {

            if( doi.length == 0 ) {
                nonDuplicated = true;
            }

            if( nonDuplicated == true ) {

                sh.insert({ 
                    link: element["link"],
                    abstract: "(\'" + escape(element["description"]) + "\')",
                    authors: "",
                    date: element["pubDate"].toString(),
                    doi: chemrxivDoi,
                    title: escape(element["title"]) })
                .into('content_preprints')
                .run()
                .then(() => {
                    logger.info('Inserted '+chemrxivDoi+' / '+element["pubDate"].toString());
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