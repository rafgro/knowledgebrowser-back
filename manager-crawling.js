
const logging = require('./logger');
const crawlRssGeneric = require('./crawlRssGeneric');

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

    logger.info( '------------------CRAWLING START------------------' );
    let currentHour = (new Date).getUTCHours();

    sh.select('*').from('manager_lines')
    .run()
    .then(result => {
        
        result.forEach( element => {
            if( element.frequency.split(",").includes(currentHour) ) {
                if( element.mode == 'rss' ) {
                    crawlRssGeneric.start( element.name, element.mainurl, element.mainsuburls );
                }
            }
        });

    })
    .catch(e => {
        logger.error(e);
    });
};