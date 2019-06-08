
const logging = require('./logger');
const request = require('request');
const striptags = require('striptags');

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

exports.start = function () {

    var subjects = ["astro-ph", "cond-mat", "cs", "econ", "eess", "gr-qc", "hep-ex", "hep-lat", "hep-ph",
    "hep-th", "math", "math-ph", "nlin", "nucl-ex", "nucl-th", "physics", "q-bio", "q-fin", "quant-ph", "stat"];

    subjects.forEach( subject => {
        logger.info(subject);
        request('http://export.arxiv.org/rss/'+subject, {timeout: 20000}, processResponseOfRss );
    } );

};

var parseXml = require('xml2js').parseString;

function processResponseOfRss (error, response, body) {

    if( error ) {
        logger.error(error);
    }
    else {
        logger.info( body.substring(0,100) );

        parseXml( body, processAndUploadToDatabase );
    }

}

function processAndUploadToDatabase (err, result) {

    if( err ) {
        logger.error(err);
    }
    else {

        result["rdf:RDF"].item.forEach( tryToInsertPublicationToDatabase );

    }

}

function tryToInsertPublicationToDatabase (element) {

    let nonDuplicated = false;
    let id = "arXiv:"+(element["link"].toString().substring(21));

    sh.select('doi').from('content_preprints').where('doi','=',id)
    .run()
    .then(doi => {

        if( doi.length == 0 ) {
            nonDuplicated = true;
        }

        if( nonDuplicated == true ) {

            let hour = (new Date).getUTCHours();
            let date = new Date(Date.now());
            let myDate = ''; //format: 2019-06-04 08:00:00
            if( hour < 10 ) { myDate = date.getUTCFullYear() + (((date.getUTCMonth()+1) < 10) ? "-0" : "-") + (date.getUTCMonth()+1)
              + ((date.getUTCDate() < 10) ? "-0" : "-")+date.getUTCDate()+' 0'+hour+':00:00'; }
            else { myDate = date.getUTCFullYear() + (((date.getUTCMonth()+1) < 10) ? "-0" : "-") + (date.getUTCMonth()+1)
              + ((date.getUTCDate() < 10) ? "-0" : "-")+date.getUTCDate()+' '+hour+':00:00'; }

            sh.insert({ 
                link: element["link"],
                abstract: "(\'" + escape(striptags(element["description"][0]["_"])) + "\')",
                authors: escape(striptags(element["dc:creator"].toString())),
                date: myDate,
                doi: id,
                title: escape(element["title"]) })
            .into('content_preprints')
            .run()
            .then(() => {
                logger.info('Inserted '+id+' / '+myDate);
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