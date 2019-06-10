const {shiphold} = require('ship-hold');

exports.doYourJob = function( sh ) {
    return new Promise( (resolve, reject) => {
        
        const askForPubCount = sh.select('COUNT(*)').from('content_preprints').run();
        const askForIndexingOffset = sh.select('value').from('manager').where('option','=','indexing_offset').run();
        let date = new Date(Date.now());
        const askForPubToday = sh.select('COUNT(*)').from('content_preprints')
          .where('date','>=',date.getUTCFullYear() + (((date.getUTCMonth()+1) < 10) ? "-0" : "-") + (date.getUTCMonth()+1)
          + ((date.getUTCDate() < 10) ? "-0" : "-")+date.getUTCDate()+" 00:00:00").run();
        let dateMinusThree = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const askForPubThreeDays = sh.select('COUNT(*)').from('content_preprints')
          .where('date','>=',dateMinusThree.getUTCFullYear() + (((dateMinusThree.getUTCMonth()+1) < 10) ? "-0" : "-")
          + (dateMinusThree.getUTCMonth()+1) + ((dateMinusThree.getUTCDate() < 10) ? "-0" : "-")
          + dateMinusThree.getUTCDate()+" 00:00:00").run();
        let dateMinusSeven = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const askForPubLastWeek = sh.select('COUNT(*)').from('content_preprints')
          .where('date','>=',dateMinusSeven.getUTCFullYear() + (((dateMinusSeven.getUTCMonth()+1) < 10) ? "-0" : "-")
          + (dateMinusSeven.getUTCMonth()+1) + ((dateMinusSeven.getUTCDate() < 10) ? "-0" : "-")
          + dateMinusSeven.getUTCDate()+" 00:00:00").run();
        let dateMinusThirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const askForPubLastMonth = sh.select('COUNT(*)').from('content_preprints')
          .where('date','>=',dateMinusThirty.getUTCFullYear() + (((dateMinusThirty.getUTCMonth()+1) < 10) ? "-0" : "-")
          + (dateMinusThirty.getUTCMonth()+1) + ((dateMinusThirty.getUTCDate() < 10) ? "-0" : "-")
          + dateMinusThirty.getUTCDate()+" 00:00:00").run();

        let arrayOfQueries = [ askForPubCount, askForIndexingOffset, askForPubToday, askForPubThreeDays,
          askForPubLastWeek, askForPubLastMonth ];

        sh.select('name').from('manager_lines')
        .run()
        .then(result => {
            
            result.forEach( element => {
                arrayOfQueries.push( sh.select('COUNT(*)').from('content_preprints')
                .where('date','>=',dateMinusSeven.getUTCFullYear() + (((dateMinusSeven.getUTCMonth()+1) < 10) ? "-0" : "-")
                + (dateMinusSeven.getUTCMonth()+1) + ((dateMinusSeven.getUTCDate() < 10) ? "-0" : "-")
                + dateMinusSeven.getUTCDate()+" 00:00:00").and("position('"+element.name.toLowerCase()+"' in link) > 0").run() );

                arrayOfQueries.push( sh.select('date','title').from('content_preprints')
                .where("position('"+element.name.toLowerCase()+"' in link)",">",0)
                .orderBy('date','desc').limit(1,0).run() );
            });

            Promise.all( arrayOfQueries )
            .then( arrayOfResults => {
              let toResolve = [ { text: 'Discovered preprints: '+arrayOfResults[0][0].count },
                { text: 'Indexing queue: '+(parseInt(arrayOfResults[0][0].count)-parseInt(arrayOfResults[1][0].value)) },
                { text: '---' },
                { text: 'Preprints today: '+arrayOfResults[2][0].count },
                { text: 'Preprints from the last 3 days: '+arrayOfResults[3][0].count },
                { text: 'Preprints from the last week: '+arrayOfResults[4][0].count },
                { text: 'Preprints from the last month: '+arrayOfResults[5][0].count },
                { text: 'Old preprints: '+(parseInt(arrayOfResults[0][0].count)-parseInt(arrayOfResults[5][0].count)) },
                { text: '---' }];
              
              for( let i = 6; i < arrayOfResults.length; i+=2 ) {
                let noOfName = i-6;
                if( noOfName > 0 ) noOfName = noOfName/2;
                toResolve.push( { text: result[noOfName].name+' in the last week: '+arrayOfResults[i][0].count
                +' (last at '+arrayOfResults[i+1][0].date.toString().substring(0,24)+' with '
                +unescape(arrayOfResults[i+1][0].title).toString().substring(0,30)+')' } );
              }
              
              resolve( { messages: toResolve } );
            })
            .catch( e => {
                reject(e);
            });
    
        })
        .catch(e => {
            reject(e);
        });
        
    } );
};