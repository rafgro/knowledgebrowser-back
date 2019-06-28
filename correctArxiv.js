
const logging = require('./logger');
const request = require('request');

const {shiphold} = require('ship-hold');
const sh = shiphold({
    host     : "aa1f3ajh2rexsb4c.ca68v3nuzco0.us-east-2.rds.amazonaws.com",
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : 5432,
  database: 'postgres'
});
/*const sh = shiphold({
    host     : '127.0.0.1',
    user     : 'crawler',
    password : 'blackseo666',
    database : 'preprint-crawls'
});*/

exports.process = function ( preprints ) {

    // just go through each title and if necessary - rollback date to 2019-04-01 (later will update to real)

    let arrayOfQueries = new Array();
    preprints.forEach( element => {
        let needToUpdate = false;
        if( element.server == 'arXiv' ) {
            let processedTitle = unescape(element.title);
            if( processedTitle.includes('v2') || processedTitle.includes('v3') || processedTitle.includes('v4')
             || processedTitle.includes('v5') || processedTitle.includes('v6') ) {
                 needToUpdate = true;
             }
        }

        if( needToUpdate ) {
            arrayOfQueries.push( sh.update('content_preprints').set('date','2019-04-01 00:00:00')
                  .where('id','=',element.id).run() );
        }
    });

    if( arrayOfQueries.length == 0 ) logger.info('good: nothing to correct');
    else {
        Promise.all( arrayOfQueries )
        .then( el => {
            logger.info('good: updated '+arrayOfQueries.length+' arxiv preprints');
        })
        .catch( e => {
            logger.error(e.toString());
        });
    }

};