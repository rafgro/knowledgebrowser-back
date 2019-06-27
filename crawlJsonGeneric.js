
const logging = require('./logger');
const request = require('request');

const jsonPeerj = require('./crawl_specifics/jsonPeerj');

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

exports.start = function ( name, mainurl, mainsuburls=null ) {

    console.log('hey '+name);

    if( mainsuburls !== null ) {
        mainsuburls.forEach( (subject,index) => {
            setTimeout( () => {
                logger.info(subject);
                request(mainurl+subject, {timeout: 20000}, (e,r,b) => processResponseOfJson(e,r,b,name) );
            }, 3000 * index ); //slow requesting to avoid one-time ddos
        } )
    }
    else {
        logger.info('main');
        request(mainurl, {timeout: 20000}, (e,r,b) => processResponseOfJson(e,r,b,name) );
    }

};

function processResponseOfJson (error, response, body, name) {

    if( error ) {
        logger.error(error.toString());
    }
    else {
        logger.info( body.substring(0,5) );

        try {
            let res = JSON.parse(body);
            processAndUploadToDatabase( name, res );
        } catch(e) {
            logger.error(e.toString());
        }
    }

}

function processAndUploadToDatabase(name,what) {

    switch( name ) {
        case 'PeerJ Preprints': jsonPeerj.processJsonBody( sh, what, name ); break;
    }

}