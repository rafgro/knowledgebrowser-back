
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
/*const sh = shiphold({
    host     : '127.0.0.1',
    user     : 'crawler',
    password : 'blackseo666',
    database : 'preprint-crawls'
});*/

exports.start = function () {

    var subjects = ["animal%20behavior%20and%20cognition", "biochemistry", "bioengineering", "bioinformatics", "biophysics", 
    "cancer%20biology", "cell%20biology", "clinical%20trials", "developmental%20biology", "ecology", "epidemiology",
    "evolutionary%20biology", "genetics", "genomics", "immunology", "microbiology", "molecular%20biology",
    "neuroscience", "paleontology", "pathology", "pharmacology%20and%20toxicology", "physiology", "plant%20biology",
    "scientific%20communication", "synthetic%20biology", "systems%20biology", "zoology"];

    subjects.forEach( subject => {
        logger.info(subject);
        request('http://connect.biorxiv.org/biorxiv_xml.php?subject='+subject, {timeout: 20000}, processResponseOfRss );
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

    sh.select('doi').from('content_preprints').where('doi','=',element["dc:identifier"])
    .run()
    .then(doi => {

        if( doi.length == 0 ) {
            nonDuplicated = true;
        }

        if( nonDuplicated == true ) {

            let hour = (new Date).getUTCHours();
            let myDate = ''; //format: 2019-06-04 08:00:00
            if( hour < 10 ) myDate = element["dc:date"]+' 0'+hour+':00:00';
            else myDate = element["dc:date"]+' '+hour+':00:00';

            sh.insert({ 
                link: element["link"].toString().replace("\n", ""),
                abstract: "(\'" + escape(element["description"]) + "\')",
                authors: escape(element["dc:creator"]),
                date: myDate,
                doi: element["dc:identifier"],
                title: escape(element["dc:title"]) })
            .into('content_preprints')
            .run()
            .then(() => {
                logger.info('Inserted '+element["dc:identifier"]+' / '+myDate);
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