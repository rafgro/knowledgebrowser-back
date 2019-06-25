const {shiphold} = require('ship-hold');

exports.doYourJob = function( sh ) {
    return new Promise( (resolve, reject) => {
        
        const askForPubCount = sh.select('COUNT(*)').from('content_preprints').run();
        const askForIndexingOffset = sh.select('value').from('manager').where('option','=','indexing_offset').run();
        const askForIndexingOffsetAbstract = sh.select('value').from('manager').where('option','=','indexing_offset_abstract').run();
        let date = new Date(Date.now());
        let currentHour = (date.getUTCHours() < 10 ? "0" : "") + date.getUTCHours();
        currentHour = currentHour.toString();
        let previousHour = date.getUTCHours() - 1;
        if( previousHour < 0 ) previousHour = 23;
        previousHour = (previousHour < 10 ? "0" : "") + previousHour;
        previousHour = previousHour.toString();
        let dateMinusOne = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
        //reject( { currentHour, previousHour } );
        const askForPubToday = sh.select('COUNT(*)').from('content_preprints')
          .where('date','>=',dateMinusOne.getUTCFullYear() + (((dateMinusOne.getUTCMonth()+1) < 10) ? "-0" : "-") + (dateMinusOne.getUTCMonth()+1)
          + ((dateMinusOne.getUTCDate() < 10) ? "-0" : "-")+dateMinusOne.getUTCDate()+" "+currentHour+":00:00")
          .and('date','<=',date.getUTCFullYear() + (((date.getUTCMonth()+1) < 10) ? "-0" : "-") + (date.getUTCMonth()+1)
          + ((date.getUTCDate() < 10) ? "-0" : "-")+date.getUTCDate()+" "+currentHour+":59:59")
          .run();
        const askForPubYesterday = sh.select('COUNT(*)').from('content_preprints')
          .where('date','>=',dateMinusOne.getUTCFullYear() + (((dateMinusOne.getUTCMonth()+1) < 10) ? "-0" : "-")
          + (dateMinusOne.getUTCMonth()+1) + ((dateMinusOne.getUTCDate() < 10) ? "-0" : "-")
          + dateMinusOne.getUTCDate()+" "+currentHour+":00:00")
          .where('date','<=',dateMinusOne.getUTCFullYear() + (((dateMinusOne.getUTCMonth()+1) < 10) ? "-0" : "-")
          + (dateMinusOne.getUTCMonth()+1) + ((dateMinusOne.getUTCDate() < 10) ? "-0" : "-")
          + dateMinusOne.getUTCDate()+" "+previousHour+":59:59")
          .run();
        let dateMinusThree = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const askForPubThreeDays = sh.select('COUNT(*)').from('content_preprints')
          .where('date','>=',dateMinusThree.getUTCFullYear() + (((dateMinusThree.getUTCMonth()+1) < 10) ? "-0" : "-")
          + (dateMinusThree.getUTCMonth()+1) + ((dateMinusThree.getUTCDate() < 10) ? "-0" : "-")
          + dateMinusThree.getUTCDate()+" "+currentHour+":00:00")
          .and('date','<=',date.getUTCFullYear() + (((date.getUTCMonth()+1) < 10) ? "-0" : "-") + (date.getUTCMonth()+1)
          + ((date.getUTCDate() < 10) ? "-0" : "-")+date.getUTCDate()+" "+previousHour+":59:59")
          .run();
        let dateMinusSeven = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const askForPubLastWeek = sh.select('COUNT(*)').from('content_preprints')
          .where('date','>=',dateMinusSeven.getUTCFullYear() + (((dateMinusSeven.getUTCMonth()+1) < 10) ? "-0" : "-")
          + (dateMinusSeven.getUTCMonth()+1) + ((dateMinusSeven.getUTCDate() < 10) ? "-0" : "-")
          + dateMinusSeven.getUTCDate()+" "+previousHour+":59:59")
          .and('date','<=',date.getUTCFullYear() + (((date.getUTCMonth()+1) < 10) ? "-0" : "-") + (date.getUTCMonth()+1)
          + ((date.getUTCDate() < 10) ? "-0" : "-")+date.getUTCDate()+" "+previousHour+":59:59")
          .run();
        let dateMinusFourteen = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const askForPubPreviousWeek = sh.select('COUNT(*)').from('content_preprints')
          .where('date','>=',dateMinusFourteen.getUTCFullYear() + (((dateMinusFourteen.getUTCMonth()+1) < 10) ? "-0" : "-")
          + (dateMinusFourteen.getUTCMonth()+1) + ((dateMinusFourteen.getUTCDate() < 10) ? "-0" : "-")
          + dateMinusFourteen.getUTCDate()+" "+currentHour+":00:00")
          .and('date','<',dateMinusSeven.getUTCFullYear() + (((dateMinusSeven.getUTCMonth()+1) < 10) ? "-0" : "-") + (dateMinusSeven.getUTCMonth()+1)
          + ((dateMinusSeven.getUTCDate() < 10) ? "-0" : "-")+dateMinusSeven.getUTCDate()+" "+previousHour+":59:59")
          .run();
        let dateMinusThirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const askForPubLastMonth = sh.select('COUNT(*)').from('content_preprints')
          .where('date','>=',dateMinusThirty.getUTCFullYear() + (((dateMinusThirty.getUTCMonth()+1) < 10) ? "-0" : "-")
          + (dateMinusThirty.getUTCMonth()+1) + ((dateMinusThirty.getUTCDate() < 10) ? "-0" : "-")
          + dateMinusThirty.getUTCDate()+" "+currentHour+":00:00")
          .and('date','<=',date.getUTCFullYear() + (((date.getUTCMonth()+1) < 10) ? "-0" : "-") + (date.getUTCMonth()+1)
          + ((date.getUTCDate() < 10) ? "-0" : "-")+date.getUTCDate()+" "+previousHour+":59:59")
          .run();
          
        const askForLastTenQueries = sh.select('query').from('query_stats').orderBy('id','desc').limit(10).run();
        const askForLastQueryQualities = sh.select('lastquality').from('query_stats').run();
        const askForLowQualityQueries = sh.select('query').from('query_stats').where('lastquality','<',3).run();

        const askForLastFivePreprints = sh.select('date','link','title').from('content_preprints')
         .where('date','<=',date.getUTCFullYear() + (((date.getUTCMonth()+1) < 10) ? "-0" : "-") + (date.getUTCMonth()+1)
         + ((date.getUTCDate() < 10) ? "-0" : "-")+date.getUTCDate()+" "+previousHour+":59:59")
         .orderBy('date','desc').limit(6,0).run();

        let arrayOfQueries = [ askForPubCount, askForIndexingOffset, askForIndexingOffsetAbstract, askForPubToday, askForPubThreeDays,
          askForPubLastWeek, askForPubLastMonth, askForLastTenQueries, askForLastQueryQualities, askForLowQualityQueries,
          askForLastFivePreprints, askForPubYesterday, askForPubPreviousWeek ];

        sh.select('name').from('manager_lines')
        .run()
        .then(result => {
            
            result.forEach( element => {
              arrayOfQueries.push( sh.select('COUNT(*)').from('content_preprints')
              .where('date','>=',dateMinusSeven.getUTCFullYear() + (((dateMinusSeven.getUTCMonth()+1) < 10) ? "-0" : "-")
              + (dateMinusSeven.getUTCMonth()+1) + ((dateMinusSeven.getUTCDate() < 10) ? "-0" : "-")
              + dateMinusSeven.getUTCDate()+" "+currentHour+":00:00").and('server','=',element.name).run() );

              arrayOfQueries.push( sh.select('COUNT(*)').from('content_preprints')
              .where('date','>=',dateMinusThirty.getUTCFullYear() + (((dateMinusThirty.getUTCMonth()+1) < 10) ? "-0" : "-")
              + (dateMinusThirty.getUTCMonth()+1) + ((dateMinusThirty.getUTCDate() < 10) ? "-0" : "-")
              + dateMinusThirty.getUTCDate()+" "+currentHour+":00:00").and('server','=',element.name).run() );

              arrayOfQueries.push( sh.select('date','title').from('content_preprints')
              .where('server','=',element.name)
              .orderBy('date','desc').limit(1,0).run() );

            });

            Promise.all( arrayOfQueries )
            .then( arrayOfResults => {

              let toResolve = [ { total: arrayOfResults[0][0].count },
                { queueInitial: (parseInt(arrayOfResults[0][0].count)-parseInt(arrayOfResults[1][0].value)) },
                { queueDeep: (parseInt(arrayOfResults[0][0].count)-parseInt(arrayOfResults[2][0].value)) },
                { today: arrayOfResults[3][0].count },
                { lastThreedays: arrayOfResults[4][0].count },
                { lastWeek: arrayOfResults[5][0].count },
                { lastMonth: arrayOfResults[6][0].count },
                { old: (parseInt(arrayOfResults[0][0].count)-parseInt(arrayOfResults[6][0].count)) },
                { lastPreprints: arrayOfResults[10] },
                { yesterday: arrayOfResults[11][0].count },
                { previousWeek: arrayOfResults[12][0].count }];

              let today = Date.now();
              
              let preprintServers = new Array();
              for( let i = 13; i < arrayOfResults.length; i+=3 ) {
                let noOfName = i-13;
                if( noOfName > 0 ) noOfName = noOfName/3;
                if( result[noOfName].name != 'OSF' ) {
                  let lastPreprint = '';
                  if( parseInt(arrayOfResults[i+1][0].count) > 0 ) {
                    let thatDate = (new Date(arrayOfResults[i+2][0].date)).getTime();
                    let days = (today - thatDate) / 86400000;
                    lastPreprint = days.toFixed(0)+" days ago";
                    let hours = ((today - thatDate) / 3600000);
                    if( days <= 1.25 ) lastPreprint = hours.toFixed(0)+" hours ago";
                    else if( days < 2 ) lastPreprint = "1 day ago";
                    if( hours <= 1.1 ) lastPreprint = "less than hour ago";
                    else if( hours < 2 ) lastPreprint = "1 hour ago";
                    if( result[noOfName].name == 'NEP RePEc' ) lastPreprint = "1 day ago";
                  }
                  let serverObj = { name: result[noOfName].name, lastMonth: parseInt(arrayOfResults[i+1][0].count),
                    lastWeek: parseInt(arrayOfResults[i][0].count), lastPreprint: lastPreprint };
                  preprintServers.push( serverObj );
                }
              }
              function compare(a,b) {
                if( a.lastMonth > b.lastMonth ) { return -1; }
                else if( a.lastMonth < b.lastMonth ) { return 1; }
                return 0;
              }
              preprintServers.sort(compare);
              toResolve.push( { preprintServers: preprintServers } );

              /*toResolve.push( { text: '---' } );
              toResolve.push( { text: 'Overall sum of original queries: '+arrayOfResults[8].length } );
              let lastTen = '';
              arrayOfResults[7].forEach( element => { lastTen += element.query + ', '; } );
              toResolve.push( { text: 'Ten newest quries: '+unescape(lastTen.substring(0,lastTen.length-2)) } );
              let averageQuality = arrayOfResults[8].reduce( (acc,val) => acc+parseInt(val.lastquality), 0 )
                / arrayOfResults[8].length;
              toResolve.push( { text: 'Average quality of results: '+averageQuality.toFixed(2) } );
              let lowQueries = '';
              arrayOfResults[9].forEach( element => { lowQueries += element.query + ', '; } );
              toResolve.push( { text: 'List of low quality queries: '+unescape(lowQueries.substring(0,lowQueries.length-2)) } );*/
              
              resolve( toResolve );
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