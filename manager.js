
const indexPublications = require('./indexPublications');

const {shiphold} = require('ship-hold');
const sh = shiphold({
    host     : "127.0.0.1",
    user     : "crawler",
    password : "blackseo666",
    database: 'preprint-crawls'
});

exports.start = function () {

    sh.select('value').from('manager').where('option','=', 'arxiv_offset')
    .run()
    .then(result => {

        sh.select('id').from('arxiv').orderBy('id').limit(1,16).run()//5,result[0].value).run()
        .then( onepubresult => {

            onepubresult.forEach( element => {
                console.log(element.id);
                indexPublications.index('arxiv',element.id);
                //sleep(1000); //to avoid lack of detection of duplications between terms
            } );
            
            /*if( onepubresult.length != 0 ) {
                let value = parseInt(result[0].value) +onepubresult.length;//+1;
                sh.update('manager').set('value',value.toString()).where('option','=','arxiv_offset')
                .run()
                .then(() => {
                    console.log('Offset set to '+value);
                })
                .catch(e => {
                    console.log('Not good');
                    console.log(e);
                });
            }*/

        })
        .catch( e => {
            console.log('Not good');
            console.log(e);
        })
        .finally(() => {
            sh.stop();
        });
        
    })
    .catch(e => {
        console.log('Not good');
        console.log(e);
    });
};