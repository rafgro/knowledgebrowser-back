const {shiphold} = require('ship-hold');
const readLastLines = require('read-last-lines');

exports.doYourJob = function( sh ) {
    return new Promise( (resolve, reject) => {
        
        const askForPubCount = sh.select('COUNT(*)').from('content_preprints').run();
        const askForIndexingOffset = sh.select('value').from('manager').where('option','=','indexing_offset').run();
        const askForIndexingOffsetAbstract = sh.select('value').from('manager').where('option','=','indexing_offset_abstract').run();
        const askForLastFiftyQueries = sh.select('query','lastquality','details','lastexectime').from('query_stats')
          .orderBy('id','desc').limit(20).run();
        const askForLogsOfCrawling = sh.select('name','log').from('manager_lines').where('log','IS NOT',null)
          .orderBy('name','asc').run();

        let arrayOfQueries = [ askForPubCount, askForIndexingOffset, askForIndexingOffsetAbstract,
          askForLastFiftyQueries, askForLogsOfCrawling ];

        Promise.all( arrayOfQueries )
            .then( arrayOfResults => {

              let toResolve = [ 
                { 'text': 'Initial indexing queue: '+(parseInt(arrayOfResults[0][0].count)-parseInt(arrayOfResults[1][0].value)) },
                { 'text': 'Deep indexing queue: '+(parseInt(arrayOfResults[0][0].count)-parseInt(arrayOfResults[2][0].value)) },
                { 'text': '___' },
                { 'text': 'Last queries:' }];

              let today = Date.now();

              arrayOfResults[3].forEach( query => {
                let parsed = JSON.parse(query.details);
                let lastOne = parsed[ parsed.length-1 ];
                let lasted = query.lastexectime;
                if(lasted == undefined) lasted = lastOne.executionTime;
                let relevantOnes = lastOne.howManyRelevant;
                let newest = '';
                    let thatDate = (new Date(parseInt(lastOne.newestResult))).getTime();
                    let days = (today - thatDate) / 86400000;
                    newest = days.toFixed(0)+" days ago";
                    let hours = ((today - thatDate) / 3600000);
                    if( days <= 1.25 ) newest = hours.toFixed(0)+" hours ago";
                    else if( days < 2 ) newest = "1 day ago";
                    if( hours <= 1.1 ) newest = "less than hour ago";
                    else if( hours < 2 ) newest = "1 hour ago";
                let when = '';
                    thatDate = (new Date(parseInt(lastOne.timestamp))).getTime();
                    days = (today - thatDate) / 86400000;
                    when = days.toFixed(0)+"d ago";
                    hours = ((today - thatDate) / 3600000);
                    let minutes = ((today - thatDate) / 60000);
                    if( days <= 1.25 ) when = hours.toFixed(0)+"h ago";
                    else if( days < 2 ) when = "1d ago";
                    if( hours <= 2 ) when = minutes.toFixed(0)+"m ago";

                if( lastOne.error == undefined ) {
                  toResolve.push( { 'text': when+': '+unescape(query.query) + ' (<strong>'+lasted+' ms</strong>, '
                    +query.lastquality+'/10, '+relevantOnes+' relevant, newest '+newest+')' } );
                } else {
                  toResolve.push( { 'text': when+': '+unescape(query.query) + ' (<strong>error:'
                    +unescape(lastOne.error)+'</strong>)' } );
                }
              });

              toResolve.push({ 'text': '___' });
              toResolve.push({ 'text': 'Crawl monitoring:' });
              
              arrayOfResults[4].forEach( oneline => {
                let whatText = oneline.name + ': ';
                let parsed = JSON.parse(oneline.log);
                parsed.forEach( ele => {
                    let when = '';
                    let thatDate = (new Date(parseInt(ele.timestamp))).getTime();
                    let days = (today - thatDate) / 86400000;
                    when = days.toFixed(0)+"d ago";
                    let hours = ((today - thatDate) / 3600000);
                    if( days <= 1.25 ) when = hours.toFixed(0)+"h ago";
                    else if( days < 2 ) when = "1d ago";
                    if( hours <= 1.1 ) when = "under 1h ago";
                    else if( hours < 2 ) when = "1h ago";
                    if( ele.cont == false ) whatText += '<strong>PROBLEM</strong> ';
                    else whatText += 'ok ';
                    whatText += '('+when+')  ';
                });
                toResolve.push( { 'text': whatText } );
              });
              
              toResolve.push({ 'text': '___' });
              toResolve.push({ 'text': 'Error log, 100 last lines:' });

              let fileReading = [ readLastLines.read('winston-error.log', 100), readLastLines.read('winston-combined.log', 500) ];
              Promise.all(fileReading)
              .then(arrayOfRead => {
                  if( arrayOfRead[0].length > 0 ) {
                    arrayOfRead[0].split("\n").reverse().forEach( line => toResolve.push({'text': line }) );
                  }
                  toResolve.push({ 'text': '___' });
                  toResolve.push({ 'text': 'Combined log, 500 last lines:' });
                  if( arrayOfRead[1].length > 0 ) {
                    arrayOfRead[1].split("\n").reverse().forEach( line => toResolve.push({'text': line }) );
                  }
                  resolve( toResolve );
              })
              .catch(e=>{
                reject(e.toString());
              });
        })
        .catch( e => {
            reject(e.toString());
        });
        
    } );
};