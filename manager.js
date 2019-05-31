
const indexPublications = require('./indexPublications');

const {shiphold} = require('ship-hold');
const sh = shiphold({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
  database: 'postgres'
});

exports.start = function (where) {

    sh.select('value').from('manager').where('option','=', where+'_offset')
    .run()
    .then(result => {

        sh.select('id').from(where).orderBy('id').limit(30,result[0].value).run()
        .then( onepubresult => {

            onepubresult.forEach( (element,index) => {
                setTimeout( () => {
                    //console.log(element.id);
                    let doStop = false;
                    if( index == onepubresult.length-1 ) { doStop = true; }
                    //console.log(doStop);
                    indexPublications.index(where,element.id,doStop);
                }, 1000 * index );
            } );
            
            if( onepubresult.length != 0 ) {
                let value = parseInt(result[0].value) +onepubresult.length;//+1;
                sh.update('manager').set('value',value.toString()).where('option','=',where+'_offset')
                .run()
                .then(() => {
                    //console.log('Offset set to '+value);
                })
                .catch(e => {
                    console.log('Not good');
                    console.log(e);
                })
                .finally(() => {
                    //console.log('Stopping manager');
                    sh.stop();
                });
            }
            else {
                //console.log('Stopping manager');
                sh.stop();
            }

        })
        .catch( e => {
            console.log('Not good');
            console.log(e);
        });
        
    })
    .catch(e => {
        //console.log('Not good');
        console.log(e);
    });
};