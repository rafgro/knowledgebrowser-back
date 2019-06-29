
const logContinuity = require('./logContinuity');

exports.processRssBody = function( sh, body, name ) {

    let isContinuous = false;
    
    body['rdf:RDF']['rss:item'].forEach( element => {

        let nonDuplicated = false;

        if( element['rss:link']!== undefined ) {
            let lastPos = element['rss:link'].toString().lastIndexOf("&");
            if( lastPos < 1 ) lastPos = element['rss:link'].toString().length;
            let id = element['rss:link'].toString().substring(23,lastPos);

            sh.select('doi').from('content_preprints').where('doi','=',id)
            .run()
            .then(doi => {
    
                if( doi.length == 0 ) {
                    nonDuplicated = true;
                } else {
                    isContinuous = true;
                }
    
                if( nonDuplicated == true ) {

                    let myAuthors = '';
                    if( Array.isArray(element['dc:creator']) ) myAuthors = element['dc:creator'].map(val=>val.replace(",","")).join(", ");
                    else myAuthors = element['dc:creator'].toString();

                    let hour = (new Date).getUTCHours();
                    let myDate = element["dc:date"]; //format: 2019-06-04 08:00:00
                    if( myDate.length == 7 ) myDate += '-01';
                    if( myDate.length == 4 ) myDate += '-01-01';
                    if( hour < 10 ) myDate += ' 0'+hour+':00:00';
                    else myDate += ' '+hour+':00:00';
    
                    sh.insert({ 
                        link: element['rss:link'],
                        abstract: "(\'" + escape(element['rss:description']) + "\')",
                        authors: myAuthors,
                        date: myDate,
                        doi: id,
                        title: escape(element['rss:title']),
                        server: 'NEP RePEc' })
                    .into('content_preprints')
                    .run()
                    .then(() => {
                        logger.info('Inserted '+id+' / '+myDate);
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

    setTimeout( () => {
        logContinuity.logIt( sh, isContinuous, name );
    }, 3000 );

}