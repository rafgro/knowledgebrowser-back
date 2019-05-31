
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

    sh.select('doi').from('biorxiv').where('doi','=',element["dc:identifier"])
    .run()
    .then(doi => {

        if( doi.length == 0 ) {
            nonDuplicated = true;
        }

        if( nonDuplicated == true ) {

            sh.insert({ 
                link: element["link"].toString().replace("\n", ""),
                abstract: "(\'" + escape(element["description"]) + "\')",
                authors: escape(element["dc:creator"]),
                date: element["dc:date"],
                doi: element["dc:identifier"],
                title: escape(element["dc:title"]) })
            .into('biorxiv')
            .run()
            .then(() => {
                logger.info('Inserted '+element["dc:identifier"]);
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