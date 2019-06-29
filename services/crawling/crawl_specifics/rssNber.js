
const logContinuity = require('./logContinuity');

exports.processRssBody = function( sh, body, name ) {

    let isContinuous = false;

    body.rss.channel[0].item.forEach( element => {

        let nonDuplicated = false;

        let lastPos = element['link'].toString().lastIndexOf("#");
        if( lastPos < 1 ) lastPos = element['link'].toString().length;
        let id = 'nber:'+element['link'].toString().substring(30,lastPos);

        sh.select('doi').from('content_preprints').where('doi','=',id)
        .run()
        .then(doi => {

            if( doi.length == 0 ) {
                nonDuplicated = true;
            } else {
                isContinuous = true;
            }

            if( nonDuplicated == true ) {

                let myTitle = '';
                let myAuthors = '';
                let lastPos2 = element['title'].toString().lastIndexOf(" -- by");
                if( lastPos2 > 1 ) {
                    myTitle = element['title'].toString().substring(0,lastPos2);
                    myAuthors = element['title'].toString().substring(lastPos2+7);
                } else {
                    myTitle = element['title'].toString();
                }

                let hour = (new Date).getUTCHours();
                let date = new Date(Date.now());
                let myDate = ''; //format: 2019-06-04 08:00:00
                if( hour < 10 ) { myDate = date.getUTCFullYear() + (((date.getUTCMonth()+1) < 10) ? "-0" : "-") + (date.getUTCMonth()+1)
                + ((date.getUTCDate() < 10) ? "-0" : "-")+date.getUTCDate()+' 0'+hour+':00:00'; }
                else { myDate = date.getUTCFullYear() + (((date.getUTCMonth()+1) < 10) ? "-0" : "-") + (date.getUTCMonth()+1)
                + ((date.getUTCDate() < 10) ? "-0" : "-")+date.getUTCDate()+' '+hour+':00:00'; }

                sh.insert({ 
                    link: element['link'],
                    abstract: "(\'" + escape(element['description']) + "\')",
                    authors: myAuthors,
                    date: myDate,
                    doi: id,
                    title: escape(myTitle),
                    server: 'NBER' })
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

    });

    setTimeout( () => {
        logContinuity.logIt( sh, isContinuous, name );
    }, 3000 );

}