
var nlp = require('compromise');

const {shiphold} = require('ship-hold');
const sh = shiphold({
    host     : "127.0.0.1",
    user     : "crawler",
    password : "blackseo666",
    database: 'preprint-crawls'
});

exports.start = function () {
    
    sh.select('title').from('biorxiv').where('id','=', "330")
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

        //console.log( nlpTitle.match("#Hyphenated").out('text') );

        var nouns = nlpTitle.nouns().data();
        console.log(nouns);
        var parts = nlpTitle.terms().data();
        console.log(parts);

    })
    .catch(e => {
        //console.log('Not good');
        //console.log(e);
    });
};