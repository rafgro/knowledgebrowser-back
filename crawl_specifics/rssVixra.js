
const logging = require('../logger');
const {shiphold} = require('ship-hold');
const striptags = require('striptags');

exports.processRssBody = function( sh, body ) {

    body.rss.channel[0].item.forEach( element => {

        let nonDuplicated = false;

        let worked = striptags(element.description.toString()).replace(/  +/g, ' ');
        let myDoi = worked.substring( worked.indexOf("reference: ")+11, worked.indexOf("\n",worked.indexOf("reference: ")+3) );

        sh.select('doi').from('content_preprints').where('doi','=',myDoi)
        .run()
        .then(doi => {

            if( doi.length == 0 ) {
                nonDuplicated = true;
            }

            if( nonDuplicated == true ) {

                let myAuthors = worked.substring( worked.indexOf("authors: ")+9, worked.indexOf("\n",worked.indexOf("authors: ")+3) );
                let myDate = worked.substring( worked.indexOf("date: ")+6, worked.indexOf("\n",worked.indexOf("date: ")+3) );
                let myAbstract = worked.substring( worked.indexOf("abstract: ")+11 );
                
                if(element['title'].toString().charAt(0) != '&'
                  && myAbstract.includes("Title, authors and abstract should also") == false) {

                    sh.insert({ 
                        link: element['link'],
                        abstract: "(\'" + escape(myAbstract) + "\')",
                        authors: myAuthors,
                        date: myDate,
                        doi: myDoi,
                        title: escape(element['title']),
                        server: 'viXra' })
                    .into('content_preprints')
                    .run()
                    .then(() => {
                        logger.info('Inserted '+myDoi+' / '+myDate);
                    })
                    .catch(e => {
                        logger.error(e.toString());
                    });

                }
            }

        })
        .catch(e => {
            logger.error(e.toString());
        });

    });

}