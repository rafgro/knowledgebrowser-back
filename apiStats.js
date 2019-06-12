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
          
        const askForLastTenQueries = sh.select('query').from('query_stats').orderBy('id','desc').limit(10).run();
        const askForLastQueryQualities = sh.select('lastquality').from('query_stats').run();
        const askForLowQualityQueries = sh.select('query').from('query_stats').where('lastquality','<',3).run();

        let arrayOfQueries = [ askForPubCount, askForIndexingOffset, askForPubToday, askForPubThreeDays,
          askForPubLastWeek, askForPubLastMonth, askForLastTenQueries, askForLastQueryQualities, askForLowQualityQueries ];

        sh.select('name').from('manager_lines')
        .run()
        .then(result => {
            
            result.forEach( element => {
              if(element.name != 'OSF') {
                arrayOfQueries.push( sh.select('COUNT(*)').from('content_preprints')
                .where('date','>=',dateMinusSeven.getUTCFullYear() + (((dateMinusSeven.getUTCMonth()+1) < 10) ? "-0" : "-")
                + (dateMinusSeven.getUTCMonth()+1) + ((dateMinusSeven.getUTCDate() < 10) ? "-0" : "-")
                + dateMinusSeven.getUTCDate()+" 00:00:00").and('server','=',element.name).run() );

                arrayOfQueries.push( sh.select('date','title').from('content_preprints')
                .where('server','=',element.name)
                .orderBy('date','desc').limit(1,0).run() );
              }
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
              
              let preprintServers = new Array();
              for( let i = 9; i < arrayOfResults.length; i+=2 ) {
                let noOfName = i-9;
                if( noOfName > 0 ) noOfName = noOfName/2;
                let textText = result[noOfName].name+' in the last week: '+arrayOfResults[i][0].count;
                if( arrayOfResults[i][0].count > 0 ) {
                  textText += ' (last at '+arrayOfResults[i+1][0].date.toString().substring(0,24)+' with '
                    +unescape(arrayOfResults[i+1][0].title).toString().substring(0,30)+')';
                }
                preprintServers.push( { number: parseInt(arrayOfResults[i][0].count), text: textText } );
              }
              function compare(a,b) {
                if( a.number > b.number ) { return -1; }
                else if( a.number < b.number ) { return 1; }
                return 0;
              }
              preprintServers.sort(compare);
              preprintServers.forEach( element => {
                toResolve.push( { text: element.text } );
              });

              toResolve.push( { text: '---' } );
              toResolve.push( { text: 'Overall sum of original queries: '+arrayOfResults[7].length } );
              let lastTen = '';
              arrayOfResults[6].forEach( element => { lastTen += element.query + ', '; } );
              toResolve.push( { text: 'Ten newest quries: '+unescape(lastTen.substring(0,lastTen.length-2)) } );
              let averageQuality = arrayOfResults[7].reduce( (acc,val) => acc+parseInt(val.lastquality), 0 )
                / arrayOfResults[7].length;
              toResolve.push( { text: 'Average quality of results: '+averageQuality.toFixed(2) } );
              let lowQueries = '';
              arrayOfResults[8].forEach( element => { lowQueries += element.query + ', '; } );
              toResolve.push( { text: 'List of low quality queries: '+unescape(lowQueries.substring(0,lowQueries.length-2)) } );
              
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