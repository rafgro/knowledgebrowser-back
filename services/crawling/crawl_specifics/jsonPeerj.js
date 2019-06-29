const logContinuity = require('./logContinuity');

exports.processJsonBody = function( sh, body, name ) {

    let isContinuous = false;

    body._items.forEach( element => {

        let nonDuplicated = false;

        sh.select('doi').from('content_preprints').where('doi','=','doi:'+element.doi)
        .run()
        .then(doi => {

            if( doi.length == 0 ) {
                nonDuplicated = true;
            } else {
                isContinuous = true;
            }

            if( nonDuplicated == true ) {

                let hour = (new Date).getUTCHours();
                let myDate = ''; //format: 2019-06-04 08:00:00
                if( hour < 10 ) myDate = element.date+' 0'+hour+':00:00';
                else myDate = element.date+' '+hour+':00:00';

                let authors = '';
                if( Array.isArray(element.author) ) authors = element.author.join(", ");
                else authors = element.author;

                sh.insert({ 
                    link: element.fulltext_html_url,
                    abstract: "(\'" + escape(element.description) + "\')",
                    authors: escape(authors),
                    date: myDate,
                    doi: 'doi:'+element.doi,
                    title: escape(element.title),
                    server: 'PeerJ Preprints' })
                .into('content_preprints')
                .run()
                .then(() => {
                    logger.info('Inserted '+'doi:'+element.doi+' / '+myDate);
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
    
    setTimeout( () => {
        logContinuity.logIt( sh, isContinuous, name );
    }, 3000 );

}