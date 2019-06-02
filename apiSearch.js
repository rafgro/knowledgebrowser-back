const {shiphold} = require('ship-hold');

exports.doYourJob = function( sh, query ) {

    return new Promise( ( resolve, reject ) => {

        // query processing
        //todo as for now i assume simple one-term test queries


        // database querying

        sh.select('term','relevant').from('index_title').where('term','=',query)
        .run()
        .then(result => {

            // assembling and returning the results

            if( Object.keys(result).length !== 0 ) {

                //in the future in this place: assemble all variants and sum up repeating ones
                let relevant = JSON.parse( result[0].relevant );

                //expanding id to the whole publication
                sh.select('id','title','authors','abstract','doi','link','date').from('content_preprints')
                .where('id','IN','('+relevant.map(e => e.p).join(", ")+')').run()
                .then( andwhat => {

                    //mergin weight with rest of the data
                    let publications = andwhat.map( (value) => {
                        let weight = 0;
                        relevant.forEach( (element) => {
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
                            if( a.date < b.weight ) { return -1; }
                            else if( a.date > b.weight ) { return 1; }
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