
const logging = require('./logger');
const indexPublicationTitle = require('./indexPublicationTitle');
const indexPublicationAbstract = require('./indexPublicationAbstract');

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

    logger.info( '------------------INDEXING START------------------' );
    sh.select('value').from('manager').where('option','=', 'indexing_offset')
    .run()
    .then(result => {

        sh.select('id').from("content_preprints").orderBy('id').limit(20,result[0].value).run()
        .then( onepubresult => {

            let counterForPubs = 0;
            onepubresult.forEach( (element,index,array) => {
                setTimeout( () => {
                    //console.log(element.id);
                    ++counterForPubs;
                    logger.info('Working with pub number '+counterForPubs);
                    let doStop = false;
                    if( counterForPubs == array.length ) { doStop = true; }
                    //console.log(doStop);
                    indexPublicationTitle.index(element.id,doStop);
                }, 1000 * index );
            } );
            
            if( onepubresult.length != 0 ) {
                let value = parseInt(result[0].value) +onepubresult.length;//+1;
                sh.update('manager').set('value',value.toString()).where('option','=','indexing_offset')
                .run()
                .then(() => {
                    logger.info('Offset set to '+value);
                })
                .catch(e => {
                    logger.error(e);
                })
                .finally(() => {
                    //logger.info('Stopping manager 1');
                    //sh.stop();
                });
            }
            else {
                //logger.info('Stopping manager 2');
                //sh.stop();
            }

        })
        .catch( e => {
            logger.error(e);
        });
        
    })
    .catch(e => {
        logger.error(e);
    });
    
    sh.select('value').from('manager').where('option','=', 'indexing_offset_abstract')
    .run()
    .then(result => {

        sh.select('id').from("content_preprints").orderBy('id').limit(20,result[0].value).run()
        .then( onepubresult => {

            let counterForPubs = 0;
            onepubresult.forEach( (element,index,array) => {
                setTimeout( () => {
                    //console.log(element.id);
                    ++counterForPubs;
                    logger.info('Working with pub number '+counterForPubs);
                    let doStop = false;
                    if( counterForPubs == array.length ) { doStop = true; }
                    //console.log(doStop);
                    indexPublicationAbstract.index(element.id,doStop);
                }, 1000 * index );
            } );
            
            if( onepubresult.length != 0 ) {
                let value = parseInt(result[0].value) +onepubresult.length;//+1;
                sh.update('manager').set('value',value.toString()).where('option','=','indexing_offset_abstract')
                .run()
                .then(() => {
                    logger.info('Offset set to '+value);
                })
                .catch(e => {
                    logger.error(e);
                })
                .finally(() => {
                    //logger.info('Stopping manager 1');
                    //sh.stop();
                });
            }
            else {
                //logger.info('Stopping manager 2');
                //sh.stop();
            }

        })
        .catch( e => {
            logger.error(e);
        });
        
    })
    .catch(e => {
        logger.error(e);
    });
};