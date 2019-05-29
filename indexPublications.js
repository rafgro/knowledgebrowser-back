
var nlp = require('compromise');

const {shiphold} = require('ship-hold');
const sh = shiphold({
    host     : "127.0.0.1",
    user     : "crawler",
    password : "blackseo666",
    database: 'preprint-crawls'
});

exports.start = function () {
    
    sh.select('title').from('biorxiv').where('id','=', "331")
    .run()
    .then(title => {

        let titleProper = unescape(title[0]["title"]).replace(RegExp(" \\(arXiv:.*\\)"),"").replace(RegExp("\\$","g"),"");
        console.log(titleProper);

        /*

        DRAFT of indexing strategy:
        - escape $something$ and (arxiv:something)
        - assign weight to the pair term-pub, higher means higher relevancy, optimally should be one number only (1-9)
        - add terms to db always as normalized ('normal' property)
        - to avoid duplication of single words, we should start with array containing informations about state
          (0 - to insert, 1 - inserted), which can be filled by acronyms or ready nouns before reaching single words
        - verbs are scarce and should guide work around title, things around verbs should have most weight (like +1 to default),
          start with array marking weight two words from verb in both directions
        - (weight:8) extract hyphenated terms because they are often very specific and the module doesn't handle them well
        - (weight:8) extract acronyms and place them with high weight
        - (weight:7) extract pairs adjective-noun (in various combinations)
        - (weight:6) get ready nouns from module (often multi-word), we need correction mechanism for cutting out hyphenated words,
          possibly start with checking if there is hyphen before or after the noun (extreme example: i've seen 'non-' cut out!),
          an article 'the' should have more weight (+1)
        - (weight:5) all tagged words: add single nouns if they weren't added
        - (weight:4) all tagged words: add single adjectives and values
        - (weight:3) all tagged words: parentheses with cleared '(' and ')'

        */

        let nlpTitle = nlp(titleProper);
        let words = nlpTitle.terms().data();

        console.log(words.length);

        let toDb = new Array();

        // hyphenated terms
        nlpTitle.match("#Hyphenated").out('text').toString().split(" ").forEach(element => {
            if( element.length > 1 ) {
                toDb.push( { t: element, w: 8 } );
            }
        });

        // acronyms
        nlpTitle.acronyms().data().forEach(element => {
            if( element.text.length > 1 ) {
                toDb.push( { t: element.text, w: 8 } );
            }
        });

        // create array of weight change based on verb proximity
        let checkIfVerb = (word) => { return word == "Verb"; }
        let weightArrayPerWord = new Array( words.length );
        weightArrayPerWord.fill(0);
        for( let i = 0; i < words.length; i++ ) {
            if( words[i].tags.find( checkIfVerb ) ) {
                //-2
                if( i-2 >= 0 ) { weightArrayPerWord[i-2] = 1; }
                //-1
                if( i-1 >= 0 ) { weightArrayPerWord[i-1] = 1; }
                //+1
                if( i+1 <= words.length-1 ) { weightArrayPerWord[i+1] = 1; }
                //+2
                if( i+2 <= words.length-1 ) { weightArrayPerWord[i+2] = 1; }
            }
        }
        console.log(weightArrayPerWord);

        // pairs adjectives - nouns
        /*let checkIfNoun = (word) => { return word == "Noun"; }
        let checkIfAdjective = (word) => { return word == "Adjective"; }
        for( let i = 0; i < words.length; i++ ) {
            if( words[i].tags.find( checkIfNoun ) ) {
                if( i > 0 ) {
                    if( words[i-1].tags.find( checkIfAdjective ) ) {
                        toDb.push( { t: words[i-1].normal+" "+words[i].normal, w: 7 } );
                    }
                }
                if( i+1 < words.length ) {
                    if( words[i+1].tags.find( checkIfAdjective ) ) {
                        toDb.push( { t: words[i].normal+" "+words[i+1].normal, w: 7 } );
                    }
                }
            }
        }

        let getPreviousWord = (sentence) => {
            let toReturn = new Array();
            for( let i = sentence.length-1; i >= 0; i-- ) {
                if( sentence.charAt(i) == ' ' ) { break; }
                toReturn.unshift( sentence.charAt(i) );
            }
            return toReturn.join("");
        }
        let getNextWord = (sentence) => {
            let toReturn = new Array();
            for( let i = 0; i < sentence.length; i++ ) {
                if( sentence.charAt(i) == ' ' ) { break; }
                toReturn.push( sentence.charAt(i) );
            }
            return toReturn.join("");
        }

        // nouns grouped by the module
        nlpTitle.nouns().data().forEach(element => {
            if( element.normal.length > 1 ) {
                let weight = 6;
                if( element.article == 'the' ) { weight = 7; }

                if( titleProper.charAt( titleProper.indexOf(element.text)-1 ) == '-' ) {
                    toDb.push( 
                        { t: getPreviousWord( titleProper.substring( 0, titleProper.indexOf(element.text) ) ) + element.text,
                          w: weight } );
                }
                else if( element.text.charAt(element.text.length-1) == '-' ) {
                    toDb.push( 
                        { t: element.text.substring(1)
                            + getNextWord( titleProper.substring( titleProper.indexOf(element.text) + element.text.length ) ),
                          w: weight } );
                }
                else {
                    toDb.push( 
                        { t: element.text.substring(1),
                          w: weight } );
                }
            }
        });

        // single words
        nlpTitle.terms().data().forEach( element => {
            if( element.tags.find( (value) => { return value == 'Noun' } ) ) {
                toDb.push( { t: element.normal, w: 5 } );
            }
            if( element.tags.find( (value) => { return value == 'Adjective' } ) ) {
                toDb.push( { t: element.normal, w: 4 } );
            }
            if( element.tags.find( (value) => { return value == 'Value' } ) ) {
                toDb.push( { t: element.normal, w: 4 } );
            }
            if( element.tags.find( (value) => { return value == 'Parentheses' } ) ) {
                toDb.push( { t: element.normal, w: 3 } );
            }
            if( element.tags.find( (value) => { return value == 'Verb' } ) ) {
                toDb.push( { t: element.normal, w: 3 } );
            }
        });

        // normalization
        toDb = toDb.map( ( element ) => {
            return { t: element.t.replace( RegExp(",","g"), "" )
                                 .replace( RegExp("-","g"), " " )
                                 .replace( RegExp("\\.","g"), "" )
                                 .toLowerCase(),
                     w: element.w };
        });
        
        // cutting out duplicated terms
        toDb = toDb.filter( function (a) {
            return !this[a.t] && (this[a.t] = true);
        }, Object.create(null) );

        console.log(toDb);*/

        /*var nouns = nlpTitle.nouns().data();
        console.log(nouns);
        var parts = nlpTitle.terms().data();
        console.log(parts);*/

    })
    .catch(e => {
        //console.log('Not good');
        //console.log(e);
    });
};