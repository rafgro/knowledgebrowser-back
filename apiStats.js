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
          
        const askForArxivWeek = sh.select('COUNT(*)').from('content_preprints')
        .where('date','>=',dateMinusSeven.getUTCFullYear() + (((dateMinusSeven.getUTCMonth()+1) < 10) ? "-0" : "-")
        + (dateMinusSeven.getUTCMonth()+1) + ((dateMinusSeven.getUTCDate() < 10) ? "-0" : "-")
        + dateMinusSeven.getUTCDate()+" 00:00:00").and("position('arxiv' in link) > 0").run();
        const askForBiorxivWeek = sh.select('COUNT(*)').from('content_preprints')
        .where('date','>=',dateMinusSeven.getUTCFullYear() + (((dateMinusSeven.getUTCMonth()+1) < 10) ? "-0" : "-")
        + (dateMinusSeven.getUTCMonth()+1) + ((dateMinusSeven.getUTCDate() < 10) ? "-0" : "-")
        + dateMinusSeven.getUTCDate()+" 00:00:00").and("position('biorxiv' in link) > 0").run();
        const askForChemrxivWeek = sh.select('COUNT(*)').from('content_preprints')
        .where('date','>=',dateMinusSeven.getUTCFullYear() + (((dateMinusSeven.getUTCMonth()+1) < 10) ? "-0" : "-")
        + (dateMinusSeven.getUTCMonth()+1) + ((dateMinusSeven.getUTCDate() < 10) ? "-0" : "-")
        + dateMinusSeven.getUTCDate()+" 00:00:00").and("position('chemrxiv' in link) > 0").run();

        const askForArxivLast = sh.select('date').from('content_preprints').where("position('arxiv' in link)",">",0)
          .orderBy('date','desc').limit(1,0).run();
        const askForBiorxivLast = sh.select('date').from('content_preprints').where("position('biorxiv' in link)",">",0)
          .orderBy('date','desc').limit(1,0).run();
        const askForChemrxivLast = sh.select('date').from('content_preprints').where("position('chemrxiv' in link)",">",0)
          .orderBy('date','desc').limit(1,0).run();
        
        Promise.all( [ askForPubCount, askForIndexingOffset, askForPubToday, askForPubThreeDays,
            askForPubLastWeek, askForPubLastMonth, askForArxivWeek, askForBiorxivWeek, askForChemrxivWeek,
            askForArxivLast, askForBiorxivLast, askForChemrxivLast ] )
        .then( ([pubCount,indexingOffset,pubToday,pubThreeDays,pubLastWeek,pubLastMonth,
                 arxivWeek,biorxivWeek,chemrxivWeek,arxivLast,biorxivLast,chemrxivLast]) => {
            resolve( { messages: [ { text: 'Discovered preprints: '+pubCount[0].count },
            { text: 'Indexing queue: '+(parseInt(pubCount[0].count)-parseInt(indexingOffset[0].value)) },
            { text: '---' },
            { text: 'Preprints today: '+pubToday[0].count },
            { text: 'Preprints from the last 3 days: '+pubThreeDays[0].count },
            { text: 'Preprints from the last week: '+pubLastWeek[0].count },
            { text: 'Preprints from the last month: '+pubLastMonth[0].count },
            { text: 'Old preprints: '+(parseInt(pubCount[0].count)-parseInt(pubLastMonth[0].count)) },
            { text: '---' },
            { text: 'arXiv in the last week: '+arxivWeek[0].count+' (last at '+arxivLast[0].date.toString().substring(0,24)+')' },
            { text: 'bioRxiv in the last week: '+biorxivWeek[0].count+' (last at '+biorxivLast[0].date.toString().substring(0,24)+')' },
            { text: 'chemRxiv in the last week: '+chemrxivWeek[0].count+' (last at '+chemrxivLast[0].date.toString().substring(0,24)+')' } ] });
        })
        .catch( e => {
            reject(e);
        });
    } );
};