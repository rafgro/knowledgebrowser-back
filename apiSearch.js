const {shiphold} = require('ship-hold');
var nlp = require('compromise');

exports.doYourJob = function( sh, query ) {

    return new Promise( ( resolve, reject ) => {

        // query processing
        let queryNlp = nlp(query);
        let queriesToDb = new Array();

        // three initial ways: original query, singular query, plural query
        queriesToDb.push( { q: query, w: 10 } );
        queriesToDb.push( { q: queryNlp.nouns().toSingular().all().out(), w: 10 } );
        queriesToDb.push( { q: queryNlp.nouns().toPlural().all().out(), w: 10 } );
        
        // working on specific words
        let words = queryNlp.terms().data();
        
        let checkIfNoun = (word) => { return word == "Noun"; }
        let checkIfAdjective = (word) => { return word == "Adjective" || word == "Comparable"; }
        words.forEach( function(word) {
            if( word.tags.find( checkIfNoun ) ) { queriesToDb.push( { q: word.normal, w: 3 } ); }
            else if( word.tags.find( checkIfAdjective ) ) { queriesToDb.push( { q: word.normal, w: 2 } ); }
            else { queriesToDb.push( { q: word.normal, w: 1 } ); }
        });

        // deleting duplications
        queriesToDb = queriesToDb.filter( function (a) { return !this[a.q] && (this[a.q] = true); }, Object.create(null) );

        //resolve( queriesToDb );

        // database querying

        sh.select('term','relevant').from('index_title')
        .where('term','IN','(\''+queriesToDb.map(e => e.q).join('\', \'')+'\')').run()
        .then(result => {

            // assembling and returning the results

            if( Object.keys(result).length !== 0 ) {

                //assemble all variants the results, multipliying base weights by relevancy weights
                let multipliedRelevant = new Array();
                for( let i = 0; i < result.length; i++ ) {
                    let queryWeight = queriesToDb.find( function(e) {
                        return e.q == result[i].term;
                    }).w;
                    JSON.parse( result[i].relevant ).forEach( e => multipliedRelevant.push( { p: e.p, w: e.w * queryWeight } ) );
                }

                //adding weights of repeated pubs
                let originalMultipliedRelevant = new Array();
                for( let i = 0; i < multipliedRelevant.length; i++ ) {
                    let howManyIdenticalPubs = multipliedRelevant.filter( function(e) {
                        return multipliedRelevant[i].p == e.p
                    });
                    if( howManyIdenticalPubs.length > 1 ) {
                        let overallWeight = 0;
                        howManyIdenticalPubs.forEach( e => overallWeight += e.w );
                        originalMultipliedRelevant.push( { p: howManyIdenticalPubs[0].p, w: overallWeight } );
                    }
                    else {
                        originalMultipliedRelevant.push( multipliedRelevant[i] );
                    }
                }
                originalMultipliedRelevant = originalMultipliedRelevant.filter(
                    function (a) { return !this[a.p] && (this[a.p] = true); }, Object.create(null) );

                //resolve(originalMultipliedRelevant);

                //expanding id to the whole publication
                sh.select('id','title','authors','abstract','doi','link','date').from('content_preprints')
                .where('id','IN','('+originalMultipliedRelevant.map(e => e.p).join(", ")+')').run()
                .then( andwhat => {

                    //mergin weight with rest of the data
                    let publications = andwhat.map( (value) => {
                        value.title = unescape(value.title);
                        value.abstract = unescape(value.abstract).substring(0,100);

                        let weight = 0;
                        originalMultipliedRelevant.forEach( (element) => {
                            if( element.p == value.id ) { weight = element.w; }
                        });
                        value.weight = weight;

                        return value;
                    });

                    //now we can sort publications by various means
                    function compare(a,b) {
                        if( a.weight > b.weight ) { return -1; }
                        else if( a.weight < b.weight ) { return 1; }
                        else if( a.weight == b.weight ) { 
                            if( (new Date(a.date)).getTime() > (new Date(b.date)).getTime() ) { return -1; }
                            else if( (new Date(a.date)).getTime() < (new Date(b.date)).getTime() ) { return 1; }
                        }
                        return 0;
                    }
                    publications.sort(compare);

                    resolve(publications);

                })
                .catch(e=>{
                    reject(e);
                });

            }
            else {
                resolve( { "message": "No results" });
            }
            

        })
        .catch(e=>{
            reject( e );
        });
    
    });

};