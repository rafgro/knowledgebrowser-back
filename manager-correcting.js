
const logging = require('./logger');
const correctTerms = require('./correctTerms');

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

    sh.select('value').from('manager').where('option','=', 'correcting_terms_offset')
    .run()
    .then(result => {

        sh.select('term','relevant').from("index_title").orderBy('term').limit(500,result[0].value).run()
        .then( results => {
            
            correctTerms.process(results);

            if( results.length != 0 ) {
                let value = parseInt(result[0].value) +results.length;//+1;
                sh.update('manager').set('value',value.toString()).where('option','=','correcting_terms_offset')
                .run()
                .then(() => {
                    logger.info('Correction offset set to '+value);
                })
                .catch(e => {
                    logger.error(e.toString());
                });
            }

        })
        .catch( e => {
            logger.error(e.toString());
        });
        
    })
    .catch(e => {
        logger.error(e.toString());
    });
};