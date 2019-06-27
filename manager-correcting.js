
const logging = require('./logger');
const correctTerms = require('./correctTerms');

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