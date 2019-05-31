
const logging = require('./logger');
const request = require('request');

const {shiphold} = require('ship-hold');
const sh = shiphold({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
  database: 'postgres'
});

exports.start = function () {

    logger.info("chemrxiv");
    request('https://chemrxiv.org/rss/portal/chemrxiv', {timeout: 20000}, processResponseOfRss );

};

var parseXml = require('xml2js').parseString;

function processResponseOfRss (error, response, body) {

    if( error ) {
        logger.error(error);
    }
    else {
        logger.info( body.substring(0,20) );

        parseXml( body, processAndUploadToDatabase );
    }

}

function processAndUploadToDatabase (err, result) {

    if( err ) {
        logger.error(err);
    }
    else {

        result.rss.channel[0].item.forEach( tryToInsertPublicationToDatabase );

    }

}

function tryToInsertPublicationToDatabase (element) {

    let chemrxivDoi = "chemRxiv:"+element["link"].toString().substring(element["link"].toString().lastIndexOf("/")+1);
    let nonDuplicated = false;

    sh.select('doi').from('chemrxiv').where('doi','=',chemrxivDoi)
    .run()
    .then(doi => {

        if( doi.length == 0 ) {
            nonDuplicated = true;
        }

        if( nonDuplicated == true ) {

            sh.insert({ 
                link: element["link"],
                abstract: "(\'" + escape(element["description"]) + "\')",
                authors: "",
                date: element["pubDate"].toString().substring(0,10),
                doi: chemrxivDoi,
                title: escape(element["title"]) })
            .into('chemrxiv')
            .run()
            .then(() => {
                logger.info('Inserted '+chemrxivDoi);
            })
            .catch(e => {
                logger.error(e);
            });
        }

    })
    .catch(e => {
        logger.error(e);
    });
    
}