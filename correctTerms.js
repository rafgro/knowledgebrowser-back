
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

exports.process = function ( terms ) {

    // first: download list of ids
    // then: check each relevant if contains empty, and if so, modify and update
    
    //console.log(terms);

    sh.select('id').from('content_preprints')
    .run()
    .then(ids => {
        let idList = ids.map(e=>e.id);
        let arrayOfQueries = new Array();
        terms.forEach( element => {
            let needToUpdate = false;
            let modified = new Array();
            JSON.parse(element.relevant).forEach(element2 => {
                if( idList.includes(parseInt(element2.p)) == false ) {
                    needToUpdate = true;
                } else {
                    modified.push(element2); //push only if the pub exists
                }
            });
            
            if( needToUpdate ) {
                arrayOfQueries.push( sh.update('index_title').set('relevant','\''+JSON.stringify(modified)+'\'')
                  .where('term','=',element.term).run() );
            }
        });

        if( arrayOfQueries.length == 0 ) console.log('good: nothing to correct in '+terms.length+' terms');
        else {
            Promise.all( arrayOfQueries )
            .then( el => {
                console.log('good: updated '+arrayOfQueries.length+' out of '+terms.length+' terms');
            })
            .catch( e => {
                logger.error(e.toString());
            });
        }
        
    })
    .catch(e => {
        logger.error(e.toString());
    });

};