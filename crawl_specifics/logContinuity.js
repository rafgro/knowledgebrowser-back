
const {shiphold} = require('ship-hold');

exports.logIt = function( sh, trueOrFalse, what ) {
    sh.select('log').from('manager_lines').where('name','=',what)
        .run()
        .then(currentLog => {

            let timestamp = Date.now();

            if( currentLog[0].log == null ) {
                //first time log
                let log_text = '[{"timestamp":'+timestamp+',"cont":'+trueOrFalse+'}]';
                sh.update('manager_lines').set('log','\''+log_text+'\'').where('name','=',what).run();

            } else {
                //appending log
                let now = JSON.parse(currentLog[0].log);
                if( now.length > 50 ) now = now.slice(0,49);
                now.unshift( { "timestamp": timestamp,"cont": trueOrFalse } );
                sh.update('manager_lines').set('log','\''+JSON.stringify(now)+'\'').where('name','=',what).run();
            }
        })
        .catch(e => {
            logger.error(e.toString());
        });
}