
const logging = require('./logger');
const request = require('request');

const rssArxiv = require('./crawl_specifics/rssArxiv');
const rssBiorxiv = require('./crawl_specifics/rssBiorxiv');
const rssChemrxiv = require('./crawl_specifics/rssChemrxiv');
const rssOsf = require('./crawl_specifics/rssOsf');

const {shiphold} = require('ship-hold');
const sh = shiphold({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
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
                request(mainurl+subject, {timeout: 20000}, (e,r,b) => processResponseOfRss(e,r,b,name) );
            }, 3000 * index ); //slow requesting to avoid one-time ddos
        } )
    }
    else {
        logger.info('main');
        request(mainurl, {timeout: 20000}, (e,r,b) => processResponseOfRss(e,r,b,name) );
    }

};

var parseXml = require('xml2js').parseString;

function processResponseOfRss (error, response, body, name) {

    if( error ) {
        logger.error(error);
    }
    else {
        logger.info( body.substring(0,100) );
        
        body = body.replace(/\ \>/g, "");
        body = body.replace(/\<\ /g, "");

        parseXml( body, (e,r) => processAndUploadToDatabase(e,r,name) );
    }

}

function processAndUploadToDatabase (err, result, name) {

    if( err ) {
        logger.error(err);
    }
    else {

        switch( name ) {
            case 'arXiv': rssArxiv.processRssBody( sh, result ); break;
            case 'bioRxiv': rssBiorxiv.processRssBody( sh, result ); break;
            case 'chemRxiv': rssChemrxiv.processRssBody( sh, result ); break;
            case 'OSF': rssOsf.processRssBody( sh, result ); break;
        }

    }

}