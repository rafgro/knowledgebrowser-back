const {shiphold} = require('ship-hold');
var nlp = require('compromise');

exports.doYourJob = function( sh, query, limit=10, offset=0, freshmode=0 ) {

    return new Promise( ( resolve, reject ) => {

        let hrstart = process.hrtime();

        // query sanitization
        if( query === undefined ) { reject( { "message": "Please enter your query." }); }
        if( query.length < 1 || query == " " ) { reject( { "message": "Please enter your query." }); }
        let workingQuery = query;
        if( query.length > 100 ) { workingQuery = workingQuery.substring(0,100); }
        workingQuery = workingQuery.replace(/\'/g,"").replace(/\:/g," ").replace(/\;/g," ").replace(/\"/g,"")
          .replace(/\//g," ").replace(/\\/g," ");
        if( query.length < 1 || query == " " ) { reject( { "message": "Please enter your query." }); }

        // query processing
        let queryNlp = nlp(workingQuery);
        let queriesToDb = new Array();
        
        // onewordquery
        let oneword = true;
        if( workingQuery.includes(' ') ) oneword = false;

        // different forms are of lower weight when less words
        let lowerWeight = 9;
        if( oneword ) lowerWeight = 8;

        // three initial ways: original query, singular query, plural query
        queriesToDb.push( { q: queryNlp.normalize().toLowerCase().out(), w: 10 } );
        queriesToDb.push( { q: queryNlp.nouns().toSingular().all().normalize().toLowerCase().out(), w: lowerWeight } );
        queriesToDb.push( { q: queryNlp.nouns().toPlural().all().normalize().toLowerCase().out(), w: lowerWeight } );
        
        // working on specific words
        queryNlp = nlp(workingQuery);
        let words = queryNlp.terms().data();
        //console.log(JSON.stringify(words));
        //resolve(JSON.stringify(words));

        function populateWordToForms( noun ) {
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
            toReturn.push( processedNoun + 'ational' );
            toReturn.push( processedNoun + 'ary' );
            if( noun.includes('ity') ) toReturn.push( noun.substring(0,noun.length-3) );
            if( noun.includes('al') ) toReturn.push( noun.substring(0,noun.length-2) );
            return toReturn;
        }

        // pairs with nouns: adjectives, verbs, acronyms, other nouns
        let checkIfNoun = (word) => { return word == "Noun"; }
        let checkIfAdjective = (word) => { return word == "Adjective" || word == "Comparable"; }
        let checkIfAcronym = (word) => { return word == "Acronym"; }
        let checkIfValue = (word) => { return word == "Value"; }
        let checkIfVerb = (word) => { return word == "Verb"; }
        let checkIfPreposition = (word) => { return word == "Preposition"; }
        let numberOfImportantWords = 0;
        if( oneword == false ) {
            for( let i = 0; i < words.length; i++ ) {
                if( words[i].tags.find( checkIfNoun ) || words[i].tags.find( checkIfAdjective ) || words[i].tags.find( checkIfAcronym )
                || words[i].tags.find( checkIfValue ) || words[i].tags.find( checkIfVerb ) || words[i].tags.find( checkIfPreposition ) )
                  { numberOfImportantWords++; }

                if( words[i].tags.find( checkIfNoun ) ) {
    
                    let singular = true;
                    if( nlp(words[i].normal).nouns().isPlural().out().length > 0 ) singular = false;
    
                    if( i > 0 ) {
                        let weight = 0;
                        if( words[i-1].tags.find( checkIfAdjective ) ) { weight = 9; }
                        else if( words[i-1].tags.find( checkIfVerb ) ) { weight = 7; }
                        else if( words[i-1].tags.find( checkIfAcronym ) ) { weight = 8; }
                        else if( words[i-1].tags.find( checkIfValue ) ) { weight = 6; }
                        else if( words[i-1].tags.find( checkIfNoun ) ) { weight = 8; }

                        if( weight > 0 ) {
                            // the second word is noun

                            queriesToDb.push( { q: words[i-1].normal+" "+words[i].normal, w: weight } );
                            if( singular ) {
                                queriesToDb.push( { q: nlp(words[i-1].normal+" "+words[i].normal).nouns()
                                .toPlural().all().normalize().out(), w: weight-1 } );
                            }
                            else {
                                queriesToDb.push( { q: nlp(words[i-1].normal+" "+words[i].normal).nouns()
                                .toSingular().all().normalize().out(), w: weight-1 } );
                            }
                            populateWordToForms(words[i].normal).forEach( 
                                e => queriesToDb.push( { q: words[i-1].normal+" "+e, w: weight } ) );
                        }
                    }
                    if( i+1 < words.length ) {
                        let weight = 0;
                        if( words[i+1].tags.find( checkIfAdjective ) ) { weight = 9; }
                        else if( words[i+1].tags.find( checkIfVerb ) ) { weight = 7; }
                        else if( words[i+1].tags.find( checkIfAcronym ) ) { weight = 8; }
                        else if( words[i+1].tags.find( checkIfValue ) ) { weight = 6; }
                        else if( words[i+1].tags.find( checkIfNoun ) ) { weight = 8; }

                        if( weight > 0 ) {
                            // the first word is noun

                            queriesToDb.push( { q: words[i].normal+" "+words[i+1].normal, w: weight } );
                            if( singular ) {
                                queriesToDb.push( { q: nlp(words[i].normal+" "+words[i+1].normal).nouns()
                                .toPlural().all().normalize().out(), w: weight-1 } );
                            }
                            else {
                                queriesToDb.push( { q: nlp(words[i].normal+" "+words[i+1].normal).nouns()
                                .toSingular().all().normalize().out(), w: weight-1 } );
                            }
                            populateWordToForms(words[i].normal).forEach( 
                                e => queriesToDb.push( { q: e+" "+words[i+1].normal, w: weight } ) );
                        }

                    }
                }
            }
        }
        if( numberOfImportantWords == 0 ) numberOfImportantWords = 1;
        
        // single words
        if( oneword == false ) {
            words.forEach( function(word) {
                if( word.tags.find( checkIfNoun ) ) {
                    queriesToDb.push( { q: word.normal, w: 4 } );
                    populateWordToForms(word.normal).forEach( e => queriesToDb.push( { q: e, w: 3 } ) );
                    queriesToDb.push( { q: nlp(word.normal).nouns().toSingular().all().normalize().out(), w: 3 } );
                    queriesToDb.push( { q: nlp(word.normal).nouns().toPlural().all().normalize().out(), w: 3 } );
                }
                else if( word.tags.find( checkIfAdjective ) ) {
                    queriesToDb.push( { q: word.normal, w: 3 } );
                    populateWordToForms(word.normal).forEach( e => queriesToDb.push( { q: e, w: 2 } ) );
                }
                else if( word.tags.find( checkIfPreposition ) ) {
                    queriesToDb.push( { q: word.normal, w: 2 } );
                }
                else { queriesToDb.push( { q: word.normal, w: 1 } ); }
            });
        }

        // deleting duplications
        queriesToDb = queriesToDb.filter( function (a) { return !this[a.q] && (this[a.q] = true); }, Object.create(null) );
        //resolve(queriesToDb);

        // database querying

        sh.select('term','relevant').from('index_title')
        .where('term','IN','(\''+queriesToDb.map(e => e.q).join('\', \'')+'\')').run()
        .then(result => {

            // assembling and returning the results

            if( Object.keys(result).length !== 0 ) {

                let originalTerms = []; //for adding strong around words
                //assemble all variants the results, multipliying base weights by relevancy weights
                let multipliedRelevant = new Array();
                for( let i = 0; i < result.length; i++ ) {
                    let queryWeight = queriesToDb.find( function(e) {
                        return e.q == result[i].term;
                    }).w;
                    originalTerms.push(result[i].term);
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

                function strongifyText( text, listToStrong ) {
                    let tempText = text;
                    let listOfWords = listToStrong.join(" ").split(" ").filter( (v,i,s) => s.indexOf(v) === i );
                    listOfWords.sort( (a,b) => {
                        if( a.length > b.length ) return -1;
                        if( a.length < b.length ) return 1;
                        return 0;
                    }); //quickfix to avoid double stronging plurals (like signal and signals)
                    listOfWords.forEach( word => {
                        let pos1 = tempText.toLowerCase().indexOf(word);
                        if( pos1 != -1 ) {
                            let can = true;
                            if( pos1 > 0 ) {
                                can = false;
                                if( tempText.charAt(pos1-1) != ">" ) { can = true; }
                            }
                            if( can ) {
                                tempText = tempText.substring(0,pos1)+"<strong>"+tempText.substring(pos1,pos1+word.length)
                                           +"</strong>"+tempText.substring(pos1+word.length);
                            }
                        }
                    });
                    return tempText;
                }

                function calculateRelativeWeight( originalWeight, noOfWords ) {
                    switch( noOfWords ) {
                        case 1:
                            if( originalWeight > 80 ) return 9;
                            else if( originalWeight > 70 ) return 8;
                            else if( originalWeight > 60 ) return 7;
                            else if( originalWeight > 50 ) return 6;
                            else if( originalWeight > 30 ) return 5;
                            else if( originalWeight > 15 ) return 4;
                            else if( originalWeight > 10 ) return 3;
                            else if( originalWeight > 6 ) return 2;
                            else { return 1; }
                            break;
                        case 2:
                            if( originalWeight > 100 ) return 10;
                            else if( originalWeight > 90 ) return 9;
                            else if( originalWeight > 80 ) return 8;
                            else if( originalWeight > 70 ) return 7;
                            else if( originalWeight > 50 ) return 6;
                            else if( originalWeight > 40 ) return 5;
                            else if( originalWeight > 35 ) return 4;
                            else if( originalWeight > 30 ) return 3;
                            else if( originalWeight > 25 ) return 2;
                            else { return 1; }
                            break;
                        case 3:
                            if( originalWeight > 170 ) return 10;
                            else if( originalWeight > 140 ) return 9;
                            else if( originalWeight > 110 ) return 8;
                            else if( originalWeight > 100 ) return 7;
                            else if( originalWeight > 90 ) return 6;
                            else if( originalWeight > 80 ) return 5;
                            else if( originalWeight > 70 ) return 4;
                            else if( originalWeight > 50 ) return 3;
                            else if( originalWeight > 30 ) return 2;
                            else { return 1; }
                            break;
                        case 4:
                            if( originalWeight > 170 ) return 10;
                            else if( originalWeight > 140 ) return 9;
                            else if( originalWeight > 120 ) return 8;
                            else if( originalWeight > 110 ) return 7;
                            else if( originalWeight > 100 ) return 6;
                            else if( originalWeight > 90 ) return 5;
                            else if( originalWeight > 80 ) return 4;
                            else if( originalWeight > 70 ) return 3;
                            else if( originalWeight > 50 ) return 2;
                            else { return 1; }
                            break;
                        default:
                            if( originalWeight > 170+((noOfWords-4)*10) ) return 10;
                            else if( originalWeight > 140+((noOfWords-4)*10) ) return 9;
                            else if( originalWeight > 120+((noOfWords-4)*10) ) return 8;
                            else if( originalWeight > 110+((noOfWords-4)*10) ) return 7;
                            else if( originalWeight > 100+((noOfWords-4)*10) ) return 6;
                            else if( originalWeight > 90+((noOfWords-4)*10) ) return 5;
                            else if( originalWeight > 80+((noOfWords-4)*10) ) return 4;
                            else if( originalWeight > 70+((noOfWords-4)*10) ) return 3;
                            else if( originalWeight > 50+((noOfWords-4)*10) ) return 2;
                            else { return 1; }
                    }
                }

                function whatsTheLimit( noOfWords ) {
                    switch( noOfWords ) {
                        case 1: return 15;
                        case 2: return 35;
                        case 3: return 70;
                        case 4: return 80;
                        default: return 80+((noOfWords-4)*10);
                    }
                }
                let limitOfRelevancy = whatsTheLimit( numberOfImportantWords );

                //idea: node is stalling during mapping results to weights when there are thousands of them,
                // so we need to pass to node only the last step of processing,
                // so we can: 1. divide pubs to two arrays - relevant and low relevancy (just one foreach!)
                // then: 2. ask for them in two queries BUT leave sorting by date and limiting for faster postgres
                // then: 3. merge both queries and map only that part that will be sent by api
                // maybe three arrays: relevant, grey area (3-2/10) and then unrelevant (1/10)

                //1
                let moreRelevantIds = new Array();
                let lessRelevantIds = new Array();
                let weightsById = new Array();
                originalMultipliedRelevant.forEach( element => {
                    weightsById[parseInt(element.p)] = element.w;
                    if( element.w > limitOfRelevancy ) moreRelevantIds.push({p:element.p,w:element.w});
                    else lessRelevantIds.push({p:element.p,w:element.w});
                });

                //2
                let arrayOfQueries = new Array();
                let moreRelevantNeeded = false;
                let moreRelevantOffset = 0;
                let moreRelevantLimit = 0;
                let lessRelevantNeeded = false;
                let lessRelevantOffset = 0;
                let lessRelevantLimit = 0;
                
                let offsetAsNumber = parseInt(offset);
                if( moreRelevantIds.length > 0 && lessRelevantIds.length > 0 ) {

                    if( offsetAsNumber == 0 ) {
                        moreRelevantNeeded = true;
                        moreRelevantOffset = 0;
                        if( moreRelevantIds.length > 10 ) {
                            moreRelevantLimit = 10;
                            lessRelevantNeeded = false;
                        }
                        else {
                            moreRelevantLimit = moreRelevantIds.length;
                            lessRelevantNeeded = true;
                            lessRelevantOffset = 0;
                            if( lessRelevantIds.length > 10-moreRelevantLimit ) lessRelevantLimit = 10-moreRelevantLimit;
                            else lessRelevantLimit = lessRelevantIds.length;
                        }
                    } else {
                        if( offsetAsNumber < moreRelevantIds.length ) {
                            moreRelevantNeeded = true;
                            moreRelevantOffset = offsetAsNumber;
                            if( moreRelevantIds.length > offsetAsNumber+10 ) {
                                moreRelevantLimit = 10;
                                lessRelevantNeeded = false;
                            }
                            else {
                                moreRelevantLimit = moreRelevantIds.length-offsetAsNumber;
                                lessRelevantNeeded = true;
                                lessRelevantOffset = 0;
                                if( lessRelevantIds.length > 10-moreRelevantLimit ) lessRelevantLimit = 10-moreRelevantLimit;
                                else lessRelevantLimit = lessRelevantIds.length;
                            }
                        } else {
                            moreRelevantNeeded = false;
                            lessRelevantNeeded = true;
                            lessRelevantOffset = offsetAsNumber-moreRelevantIds.length;
                            if( lessRelevantIds.length > offsetAsNumber+10 ) {
                                lessRelevantLimit = 10;
                            } else {
                                lessRelevantLimit = lessRelevantIds.length-offsetAsNumber;
                            }
                        }
                    }
                } else if( moreRelevantIds.length > 0 ) {
                    moreRelevantNeeded = true;
                    if( offsetAsNumber == 0 ) {
                        moreRelevantOffset = 0;
                        if( moreRelevantIds.length > 10 ) {
                            moreRelevantLimit = 10;
                        }
                        else {
                            moreRelevantLimit = moreRelevantIds.length;
                        }
                    } else {
                        moreRelevantOffset = offsetAsNumber;
                        if( moreRelevantIds.length > offsetAsNumber+10 ) {
                                moreRelevantLimit = 10;
                        }
                        else {
                            moreRelevantLimit = moreRelevantIds.length-offsetAsNumber;
                        }
                    }
                } else if( lessRelevantIds.length > 0 ) {
                    lessRelevantNeeded = true;
                    if( offsetAsNumber == 0 ) {
                        lessRelevantOffset = 0;
                        if( lessRelevantIds.length > 10 ) {
                            lessRelevantLimit = 10;
                        }
                        else {
                            lessRelevantLimit = lessRelevantIds.length;
                        }
                    } else {
                        lessRelevantOffset = offsetAsNumber;
                        if( lessRelevantIds.length > offsetAsNumber+10 ) {
                            lessRelevantLimit = 10;
                        }
                        else {
                            lessRelevantLimit = lessRelevantIds.length-offsetAsNumber;
                        }
                    }
                }

                if( moreRelevantNeeded ) { 
                    arrayOfQueries.push( sh.select('id','title','authors','abstract','doi','link','date','server')
                    .from('content_preprints')
                    .where('id','IN','('+moreRelevantIds.map(e => e.p).join(", ")+')')
                    .orderBy('date','desc')
                    .orderBy('id','asc')
                    .limit(moreRelevantLimit, moreRelevantOffset)
                    .run() );
                }
                if( lessRelevantNeeded ) {

                    // dividing to more and less relevant one step further
                    let furtherHigher = new Array();
                    let furtherLower = new Array();
                    let boundary = limitOfRelevancy*0.8;
                    lessRelevantIds.forEach( element => {
                        if( element.w > boundary ) furtherHigher.push({p:element.p,w:element.w});
                        else furtherLower.push({p:element.p,w:element.w});
                    });

                    // taking all from higher boundary first
                    if( lessRelevantOffset+10 < furtherHigher.length ) {
                        arrayOfQueries.push( sh.select('id','title','authors','abstract','doi','link','date','server')
                        .from('content_preprints')
                        .where('id','IN','('+furtherHigher.map(e => e.p).join(", ")+')')
                        .orderBy('date','desc')
                        .orderBy('id','asc')
                        .limit(10, lessRelevantOffset)
                        .run() );
                    }
                    // taking from both sides
                    else if( furtherHigher.length > 0 && furtherLower.length > 0 ) {
                        arrayOfQueries.push( sh.select('id','title','authors','abstract','doi','link','date','server')
                        .from('content_preprints')
                        .where('id','IN','('+furtherHigher.map(e => e.p).join(", ")+')')
                        .orderBy('date','desc')
                        .orderBy('id','asc')
                        .limit(10, lessRelevantOffset)
                        .run() );
                        arrayOfQueries.push( sh.select('id','title','authors','abstract','doi','link','date','server')
                        .from('content_preprints')
                        .where('id','IN','('+furtherLower.map(e => e.p).join(", ")+')')
                        .orderBy('date','desc')
                        .orderBy('id','asc')
                        .limit(10, 0)
                        .run() );
                    }
                    // taking from lower boundary if we are past higher
                    else {
                        arrayOfQueries.push( sh.select('id','title','authors','abstract','doi','link','date','server')
                        .from('content_preprints')
                        .where('id','IN','('+furtherLower.map(e => e.p).join(", ")+')')
                        .orderBy('date','desc')
                        .orderBy('id','asc')
                        .limit(10, lessRelevantOffset-furtherHigher.length)
                        .run() );
                    }

                }

                // 3
                Promise.all( arrayOfQueries )
                .then( arrayOfResults => {

                    let properArray = new Array();
                    if( arrayOfQueries.length == 3 ) properArray = arrayOfResults[0].concat(arrayOfResults[1],arrayOfResults[2]);
                    else if( arrayOfQueries.length == 2 ) properArray = arrayOfResults[0].concat(arrayOfResults[1]);
                    else properArray = arrayOfResults[0];

                    if(properArray.length > 10) properArray = properArray.slice(0,10);

                    let highestRelevancy = 0;
                    let newestResult = (new Date(properArray[0].date)).getTime();
                    let publications = properArray.map( (value) => {
                        let untitle = unescape(value.title).replace(RegExp("\\. \\(arXiv:.*\\)"),"");
                        value.title = strongifyText( untitle, originalTerms ).replace(RegExp("\\$","g"),"").replace("\\","");
                        value.authors = unescape(value.authors);
                        let unabstract = unescape(value.abstract).replace("\n"," ").replace("\\","").replace("<p>","").replace("$","");
                        value.abstract = unabstract.substring(0,unabstract.indexOf(". "));
                        value.weight = weightsById[parseInt(value.id)];
                        value.relativeWeight = calculateRelativeWeight(value.weight,numberOfImportantWords);
                        return value;
                    } );

                    if( parseInt(offset) == 0 ) {
                        let quality = 0;
                        quality = publications[0].relativeWeight/2;
                        if( publications.length >= 5 ) quality += publications[4].relativeWeight/4;
                        if( publications.length >= 10 ) quality += publications[9].relativeWeight/4;

                        let hrend = process.hrtime(hrstart);

                        let details = '{"timestamp":"'+Date.now()+'","howManyRelevant":"'+moreRelevantIds.length+
                          '","highestRelevancy":"'+highestRelevancy+'","executionTime":"'+(hrend[1]/1000000+hrend[0]*1000).toFixed(0)+
                          '","newestResult":"'+newestResult.toFixed(0)+'"}';
                        registerQueryInStats( sh, workingQuery, quality.toFixed(0), details );
                    }

                    resolve({ numberofall: originalMultipliedRelevant.length,
                        results: publications });
                    
                })
                .catch(e=>{
                    registerQueryInStats( sh, workingQuery, '0', '{"timestamp":"'+Date.now()+'"}' );
                    reject( { "message": e.toString() } );
                    //reject( { "message": "Sorry, we have encountered an error." } );
                });

            }
            else {
                registerQueryInStats( sh, workingQuery, '0', '{"timestamp":"'+Date.now()+'","howManyRelevant":"0"}' );
                reject( { "message": "Sorry, there are no results for <i>"+query+"</i>. Would you like to rephrase your query?" });
            }
            

        })
        .catch(e=>{
            registerQueryInStats( sh, workingQuery, '0', '{"timestamp":"'+Date.now()+'"}' );
            reject( { "message": "Sorry, we have encountered an error." } );
        });
    
    });

};

function registerQueryInStats( sh, query, lastQuality, newDetails ) {
    sh.select('details').from('query_stats')
        .where('query','=',escape(query)).run()
        .then(result => {

            if( result.length == 0 ) {
                
                sh.insert({ 
                    query: escape(query),
                    lastquality: lastQuality,
                    details: '\'['+newDetails+']\'' })
                .into('query_stats')
                .run()
                .then(() => {
                    //console.log('ok');
                })
                .catch(e => {
                    console.log(e);
                });
                
            } else {

                sh.update('query_stats')
                .set({
                  lastquality: lastQuality,
                  details: '\''+result[0].details.substring(0,result[0].details.length-1)+","+newDetails+']\'' })
                .where('query','=',escape(query))
                .run()
                .then(() => {
                    //console.log('ok');
                })
                .catch(e => {
                    console.log(e);
                });

            }

    })
    .catch(e=>{
        logger.info("error during query stats insertion");
    });
}