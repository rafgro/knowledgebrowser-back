
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

        sh.select('id').from('arxiv').orderBy('id').limit(5,result[0].value).run()
        .then( onepubresult => {

            onepubresult.forEach( (element,index) => {
                setTimeout( () => {
                    console.log(element.id);
                    let doStop = false;
                    if( index == onepubresult.length-1 ) { doStop = true; }
                    console.log(doStop);
                    indexPublications.index('arxiv',element.id,doStop);
                }, 1000 * index );
            } );
            
            if( onepubresult.length != 0 ) {
                let value = parseInt(result[0].value) +onepubresult.length;//+1;
                sh.update('manager').set('value',value.toString()).where('option','=','arxiv_offset')
                .run()
                .then(() => {
                    console.log('Offset set to '+value);
                })
                .catch(e => {
                    console.log('Not good');
                    console.log(e);
                })
                .finally(() => {
                    console.log('Stopping manager');
                    sh.stop();
                });
            }
            else {
                console.log('Stopping manager');
                sh.stop();
            }

        })
        .catch( e => {
            console.log('Not good');
            console.log(e);
        });
        
    })
    .catch(e => {
        console.log('Not good');
        console.log(e);
    });
};