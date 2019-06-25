const {shiphold} = require('ship-hold');

exports.doYourJob = function( sh ) {
    return new Promise( (resolve, reject) => {
        
        const askForPubCount = sh.select('COUNT(*)').from('content_preprints').run();
        const askForIndexingOffset = sh.select('value').from('manager').where('option','=','indexing_offset').run();
        const askForIndexingOffsetAbstract = sh.select('value').from('manager').where('option','=','indexing_offset_abstract').run();
        const askForLastFiftyQueries = sh.select('query','lastquality','details').from('query_stats')
          .orderBy('id','desc').limit(50).run();

        let arrayOfQueries = [ askForPubCount, askForIndexingOffset, askForIndexingOffsetAbstract, askForLastFiftyQueries ];

        Promise.all( arrayOfQueries )
            .then( arrayOfResults => {

              let toResolve = [ 
                { 'text': 'Initial indexing queue: '+(parseInt(arrayOfResults[0][0].count)-parseInt(arrayOfResults[1][0].value)) },
                { 'text': 'Deep indexing queue: '+(parseInt(arrayOfResults[0][0].count)-parseInt(arrayOfResults[2][0].value)) },
                { 'text': 'Queries:' }];

              let today = Date.now();

              arrayOfResults[3].forEach( query => {
                let parsed = JSON.parse(query.details);
                let lastOne = parsed[ parsed.length-1 ];
                let lasted = query.lastexectime;
                if(lasted == 0) lasted = lastOne.executionTime;
                let relevantOnes = lastOne.howManyRelevant;
                let newest = '';
                    let thatDate = (new Date(lastOne.newestResult)).getTime();
                    let days = (today - thatDate) / 86400000;
                    newest = days.toFixed(0)+" days ago";
                    let hours = ((today - thatDate) / 3600000);
                    if( days <= 1.25 ) newest = hours.toFixed(0)+" hours ago";
                    else if( days < 2 ) newest = "1 day ago";
                    if( hours <= 1.1 ) newest = "less than hour ago";
                    else if( hours < 2 ) newest = "1 hour ago";
                toResolve.push( { 'text': query.query + ' (<strong>'+lasted+' ms</strong>, '
                  +query.lastquality+'/10, '+relevantOnes+' relevant, newest '+newest+')' } );
              });
              
              resolve( toResolve );
        })
        .catch( e => {
            reject(e);
        });
        
    } );
};