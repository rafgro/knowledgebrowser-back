
const logging = require('./logger');
const crawlRssGeneric = require('./crawlRssGeneric');
const crawlJsonGeneric = require('./crawlJsonGeneric');

const {shiphold} = require('ship-hold');
const sh = shiphold({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
    database : 'postgres'
});
/*const sh = shiphold({
    host     : '127.0.0.1',
    user     : 'crawler',
    password : 'blackseo666',
    database : 'preprint-crawls'
});*/

exports.start = function () {

    let currentHour = '5';//(new Date).getUTCHours().toString();
    logger.info( '------------------CRAWLING START at '+currentHour+'------------------' );

    sh.select('*').from('manager_lines')
    .run()
    .then(result => {
        
        result.forEach( element => {
            if( element.frequency != null ) {
                if( element.frequency.split(",").includes(currentHour) ) {
                    if( element.mode == 'rss' ) {
                        if( element.name == 'OSF' ) {
                            let today = new Date(Date.now());
                            let ago = new Date(Date.now()-1000*60*60*24*7);
                            let todayString = today.getUTCFullYear() + (((today.getUTCMonth()+1) < 10) ? "-0" : "-") + (today.getUTCMonth()+1)
                              + ((today.getUTCDate() < 10) ? "-0" : "-")+today.getUTCDate();
                            let agoString = ago.getUTCFullYear() + (((ago.getUTCMonth()+1) < 10) ? "-0" : "-") + (ago.getUTCMonth()+1)
                              + ((ago.getUTCDate() < 10) ? "-0" : "-")+ago.getUTCDate();
                            crawlRssGeneric.start( element.name, element.mainurl+'7D%7D%2C%22filter%22%3A%5B%7B%22range%22%3A%7B%22date%22%3A%7B%22gte%22%3A%22'+agoString+'%7C%7C%2Fd%22%2C%22lte%22%3A%22'+todayString+'%7C%7C%2Fd%22%7D%7D%7D%5D%7D%7D' );
                        }
                        else {
                            crawlRssGeneric.start( element.name, element.mainurl, element.mainsuburls );
                        }
                    } else if( element.mode == 'json' ) {
                        crawlJsonGeneric.start( element.name, element.mainurl, element.mainsuburls );
                    }
                }
            }
        });

    })
    .catch(e => {
        logger.error(e);
    });
};