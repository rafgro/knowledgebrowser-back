
var nlp = require('compromise');

const {shiphold} = require('ship-hold');
const sh = shiphold({
    host     : "127.0.0.1",
    user     : "crawler",
    password : "blackseo666",
    database: 'preprint-crawls'
});

exports.start = function () {
    
    sh.select('title').from('biorxiv').where('id','=', "100")
    .run()
    .then(title => {

        let titleProper = unescape(title[0]["title"]);
        console.log(titleProper);

        /*

        DRAFT of indexing strategy:
        - extract nouns (often multi-word) as the most important terms, article 'the' should have higher weight
        - tag all words and work on them adequately, ie. dont add conjuctions, connect adjectives to nearest words,
          add single nouns if they weren't added in previous step
        - verbs are often scarce within titles but they should change weight of connections within the whole title

        */

        var parts = nlp(titleProper).terms().data();
        //var parts = nlp(titleProper).nouns().data();
        console.log(parts);

    })
    .catch(e => {
        //console.log('Not good');
        //console.log(e);
    });
};