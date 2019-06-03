const {shiphold} = require('ship-hold');
var nlp = require('compromise');

exports.doYourJob = function( sh, query ) {

    return new Promise( ( resolve, reject ) => {

        // query processing
        let queryNlp = nlp(query);
        let queriesToDb = new Array();

        // three initial ways: original query, singular query, plural query
        queriesToDb.push( { q: queryNlp.normalize().toLowerCase().out(), w: 10 } );
        queriesToDb.push( { q: queryNlp.nouns().toSingular().all().normalize().toLowerCase().out(), w: 9 } );
        queriesToDb.push( { q: queryNlp.nouns().toPlural().all().normalize().toLowerCase().out(), w: 9 } );
        
        // working on specific words
        queryNlp = nlp(query);
        let words = queryNlp.terms().data();
        //resolve(words);

        // pairs with nouns: adjectives, verbs, acronyms, other nouns
        let checkIfNoun = (word) => { return word == "Noun"; }
        let checkIfAdjective = (word) => { return word == "Adjective" || word == "Comparable"; }
        let checkIfAcronym = (word) => { return word == "Acronym"; }
        let checkIfValue = (word) => { return word == "Value"; }
        let checkIfVerb = (word) => { return word == "Verb"; }
        for( let i = 0; i < words.length; i++ ) {
            if( words[i].tags.find( checkIfNoun ) ) {

                let singular = true;
                if( nlp(words[i].normal).nouns().isPlural().out().length > 0 ) singular = false;

                if( i > 0 ) {
                    // pair: adjective - noun
                    if( words[i-1].tags.find( checkIfAdjective ) ) {
                        queriesToDb.push( { q: words[i-1].normal+" "+words[i].normal, w: 8 } );
                        if( singular ) {
                            queriesToDb.push( { q: nlp(words[i-1].normal+" "+words[i].normal).nouns()
                            .toPlural().all().normalize().out(), w: 7 } );
                        }
                        else {
                            queriesToDb.push( { q: nlp(words[i-1].normal+" "+words[i].normal).nouns()
                            .toSingular().all().normalize().out(), w: 7 } );
                        }
                    }
                    // pair: verb - noun
                    else if( words[i-1].tags.find( checkIfVerb ) ) {
                        queriesToDb.push( { q: words[i-1].normal+" "+words[i].normal, w: 5 } );
                        if( singular ) {
                            queriesToDb.push( { q: nlp(words[i-1].normal+" "+words[i].normal).nouns()
                            .toPlural().all().normalize().out(), w: 4 } );
                        }
                        else {
                            queriesToDb.push( { q: nlp(words[i-1].normal+" "+words[i].normal).nouns()
                            .toSingular().all().normalize().out(), w: 4 } );
                        }
                    }
                    // pair: acronym - noun
                    else if( words[i-1].tags.find( checkIfAcronym ) ) {
                        queriesToDb.push( { q: words[i-1].normal+" "+words[i].normal, w: 5 } );
                        if( singular ) {
                            queriesToDb.push( { q: nlp(words[i-1].normal+" "+words[i].normal).nouns()
                            .toPlural().all().normalize().out(), w: 4 } );
                        }
                        else {
                            queriesToDb.push( { q: nlp(words[i-1].normal+" "+words[i].normal).nouns()
                            .toSingular().all().normalize().out(), w: 4 } );
                        }
                    }
                    // pair: value - noun
                    else if( words[i-1].tags.find( checkIfValue ) ) {
                        queriesToDb.push( { q: words[i-1].normal+" "+words[i].normal, w: 6 } );
                        if( singular ) {
                            queriesToDb.push( { q: nlp(words[i-1].normal+" "+words[i].normal).nouns()
                            .toPlural().all().normalize().out(), w: 5 } );
                        }
                        else {
                            queriesToDb.push( { q: nlp(words[i-1].normal+" "+words[i].normal).nouns()
                            .toSingular().all().normalize().out(), w: 5 } );
                        }
                    }
                    // pair: noun - noun
                    else if( words[i-1].tags.find( checkIfNoun ) ) {
                        queriesToDb.push( { q: words[i-1].normal+" "+words[i].normal, w: 7 } );
                        if( singular ) {
                            queriesToDb.push( { q: nlp(words[i-1].normal+" "+words[i].normal).nouns()
                            .toPlural().all().normalize().out(), w: 6 } );
                        }
                        else {
                            queriesToDb.push( { q: nlp(words[i-1].normal+" "+words[i].normal).nouns()
                            .toSingular().all().normalize().out(), w: 6 } );
                        }
                    }
                }
                if( i+1 < words.length ) {
                    // pair: noun - adjective
                    if( words[i+1].tags.find( checkIfAdjective ) ) {
                        queriesToDb.push( { q: words[i].normal+" "+words[i+1].normal, w: 8 } );
                        if( singular ) {
                            queriesToDb.push( { q: nlp(words[i].normal+" "+words[i+1].normal).nouns()
                            .toPlural().all().normalize().out(), w: 7 } );
                        }
                        else {
                            queriesToDb.push( { q: nlp(words[i].normal+" "+words[i+1].normal).nouns()
                            .toSingular().all().normalize().out(), w: 7 } );
                        }
                    }
                    // pair: noun - verb
                    else if( words[i+1].tags.find( checkIfVerb ) ) {
                        queriesToDb.push( { q: words[i].normal+" "+words[i+1].normal, w: 5 } );
                        if( singular ) {
                            queriesToDb.push( { q: nlp(words[i].normal+" "+words[i+1].normal).nouns()
                            .toPlural().all().normalize().out(), w: 4 } );
                        }
                        else {
                            queriesToDb.push( { q: nlp(words[i].normal+" "+words[i+1].normal).nouns()
                            .toSingular().all().normalize().out(), w: 4 } );
                        }
                    }
                    // pair: noun - acronym
                    else if( words[i+1].tags.find( checkIfAcronym ) ) {
                        queriesToDb.push( { q: words[i].normal+" "+words[i+1].normal, w: 5 } );
                        if( singular ) {
                            queriesToDb.push( { q: nlp(words[i].normal+" "+words[i+1].normal).nouns()
                            .toPlural().all().normalize().out(), w: 4 } );
                        }
                        else {
                            queriesToDb.push( { q: nlp(words[i].normal+" "+words[i+1].normal).nouns()
                            .toSingular().all().normalize().out(), w: 4 } );
                        }
                    }
                    // pair: noun - value
                    else if( words[i+1].tags.find( checkIfValue ) ) {
                        queriesToDb.push( { q: words[i].normal+" "+words[i+1].normal, w: 6 } );
                        if( singular ) {
                            queriesToDb.push( { q: nlp(words[i].normal+" "+words[i+1].normal).nouns()
                            .toPlural().all().normalize().out(), w: 5 } );
                        }
                        else {
                            queriesToDb.push( { q: nlp(words[i].normal+" "+words[i+1].normal).nouns()
                            .toSingular().all().normalize().out(), w: 5 } );
                        }
                    }
                    // pair: noun - noun
                    else if( words[i+1].tags.find( checkIfNoun ) ) {
                        queriesToDb.push( { q: words[i].normal+" "+words[i+1].normal, w: 7 } );
                        if( singular ) {
                            queriesToDb.push( { q: nlp(words[i].normal+" "+words[i+1].normal).nouns()
                            .toPlural().all().normalize().out(), w: 6 } );
                        }
                        else {
                            queriesToDb.push( { q: nlp(words[i].normal+" "+words[i+1].normal).nouns()
                            .toSingular().all().normalize().out(), w: 6 } );
                        }
                    }
                }
            }
        }

        function wordToAdjectives( noun ) {
            let lastCase = noun.charAt( noun.length-1 );
            let processedNoun = noun;
            if( lastCase == 'e' || lastCase == 'y' || lastCase == 'i' || lastCase == 'o' || lastCase == 'a' ) {
                processedNoun = noun.substring(0,noun.length-1);
            }
            if( lastCase == 's' && noun.charAt(noun.length-2) == 'c' ) {
                processedNoun = noun.substring(0,noun.length-1);
            }
            let toReturn = new Array();
            toReturn.push( processedNoun + 'ic' );
            toReturn.push( processedNoun + 'al' );
            toReturn.push( processedNoun + 'ial' );
            toReturn.push( processedNoun + 'ical' );
            toReturn.push( processedNoun + 'ous' );
            if( noun.includes('ity') ) toReturn.push( noun.substring(0,noun.length-3) );
            if( noun.includes('al') ) toReturn.push( noun.substring(0,noun.length-2) );
            return toReturn;
        }
        
        // single words
        words.forEach( function(word) {
            if( word.tags.find( checkIfNoun ) ) {
                queriesToDb.push( { q: word.normal, w: 5 } );
                wordToAdjectives(word.normal).forEach( e => queriesToDb.push( { q: e, w: 4 } ) );
                queriesToDb.push( { q: nlp(word.normal).nouns().toSingular().all().normalize().out(), w: 3 } );
                queriesToDb.push( { q: nlp(word.normal).nouns().toPlural().all().normalize().out(), w: 3 } );
            }
            else if( word.tags.find( checkIfAdjective ) ) {
                queriesToDb.push( { q: word.normal, w: 3 } );
                wordToAdjectives(word.normal).forEach( e => queriesToDb.push( { q: e, w: 2 } ) );
            }
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