
const logging = require('../logger');
const {shiphold} = require('ship-hold');
const striptags = require('striptags');

exports.processRssBody = function( sh, body ) {

    body.rss.channel[0].item.forEach( element => {

        let nonDuplicated = false;

        if( element.description.toString().includes("Preprint") ) {

            let myDoi = 'philsci:'+element.link.toString().substring(32,element.link.toString().length-1);

            sh.select('doi').from('content_preprints').where('doi','=',myDoi)
            .run()
            .then(doi => {

                if( doi.length == 0 ) {
                    nonDuplicated = true;
                }

                if( nonDuplicated == true ) {

                    let myAuthors = element.description.toString().substring( 0, element.description.toString().indexOf("(")-1 );
                    let myTitle = element.description.toString().substring(element.description.toString().indexOf(")")+2,
                      element.description.toString().lastIndexOf("[Pr"));
                    let myDate = new Date(element.pubDate);

                    sh.insert({ 
                        link: element.link,
                        abstract: ' ',
                        authors: myAuthors,
                        date: myDate,
                        doi: myDoi,
                        title: escape(myTitle),
                        server: 'PhilSci' })
                    .into('content_preprints')
                    .run()
                    .then(() => {
                        logger.info('Inserted '+myDoi+' / '+myDate);
                    })
                    .catch(e => {
                        logger.error(e.toString());
                    });
                }

            })
            .catch(e => {
                logger.error(e.toString());
            });

        }

    });

}