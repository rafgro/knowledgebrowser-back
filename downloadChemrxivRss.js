
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

    console.log("chemrxiv");
    request('https://chemrxiv.org/rss/portal/chemrxiv', {timeout: 20000}, processResponseOfRss );

};

var parseXml = require('xml2js').parseString;

function processResponseOfRss (error, response, body) {

    if( error ) {
        console.log( 'Not good' );
        console.log(error);
    }
    else {
        console.log( body.substring(0,20) );

        parseXml( body, processAndUploadToDatabase );
    }

}

function processAndUploadToDatabase (err, result) {

    if( err ) {
        console.log( 'Not good' );
        console.log(err);
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
    
}