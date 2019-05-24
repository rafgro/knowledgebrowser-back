
const request = require('request');

const {shiphold} = require('ship-hold');
const sh = shiphold({
  hostname: '127.0.0.1',
  user: 'crawler',
  password: 'blackseo666',
  database: 'preprint-crawls'
});

exports.start = function () {
    var parseXml = require('xml2js').parseString;

    var subjects = ["animal%20behavior%20and%20cognition", "biochemistry", "bioengineering", "bioinformatics", "biophysics", 
    "cancer%20biology", "cell%20biology", "clinical%20trials", "developmental%20biology", "ecology", "epidemiology",
    "evolutionary%20biology", "genetics", "genomics", "immunology", "microbiology", "molecular%20biology",
    "neuroscience", "paleontology", "pathology", "pharmacology%20and%20toxicology", "physiology", "plant%20biology",
    "scientific%20communication", "synthetic%20biology", "systems%20biology", "zoology"];

    subjects.forEach( subject => {

        console.log(subject);

        request('http://connect.biorxiv.org/biorxiv_xml.php?subject='+subject, {timeout: 20000}, function (error, response, body) {

        if( error ) {
            console.log( 'Not good' );
            console.log(error);
        }
        else {
            //console.log( body.substring(0,100) );

            parseXml( body, function (err, result) {
            
                result["rdf:RDF"].item.forEach(function(element) {

                    let nonDuplicated = false;

                    sh.select('doi').from('biorxiv').where('doi','=',element["dc:identifier"]).run()
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
                                console.log('Inserted');
                            })
                            .catch(e => {
                                console.log('Not good');
                                console.log(e);
                            });
                        }

                    })
                    .catch(e => {
                        console.log('Not good');
                        console.log(e);
                    });
                    
                });
    
            } );
        }

    });

    });
};