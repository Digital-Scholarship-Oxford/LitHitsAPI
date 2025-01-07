const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;
const store = new N3.Store();
var allPrefixes = {};
var isDataLoaded = false;

/////////////////////////////////////////////////////////////////////////////////
async function loadData(file) {
    // Return a Promise that resolves when the data is loaded
    return new Promise((resolve, reject) => {
        $.ajaxSetup({ cache: false });
        $("#data").load(`data/${file}`, async function (responseTxt, statusTxt, xhr) {
            if (statusTxt == "success") {

                const parser_for_graphs = new N3.Parser();
                let records = [];

                parser_for_graphs.parse(responseTxt,
                    async (error, quad, prefixes) => {
                        if (quad) {
                            store.addQuad(
                                quad.subject.id,
                                quad.predicate.id,
                                quad.object.id
                                //namedNode(graph)
                            )
                        }
                        //    console.log(quad);
                        else {
                            allPrefixes = prefixes;
                            isDataLoaded = true;
                            console.log('data loaded..')
                            resolve(); // Resolve when the data is fully loaded and parsed
                        }
                    });
            }
            else{
                reject(new Error(`Error loading data: ${xhr.status} ${xhr.statusText}`));
            }
            if (statusTxt == "error")
                console.log("Error: " + xhr.status + ": " + xhr.statusText + ": <br />" + responseTxt);
        });
    });
}

///////////////////////////////////////////////////////////////
/////////////////////////////////////////////////
async function runQuery(query) {
    let myEngine = new Comunica.QueryEngine();
    let result = await myEngine.query(query, {
        sources: [store],
    });
    let bindingsStream = await result.execute();
    const bindings = await bindingsStream.toArray();
    return bindings;
}

async function getText(duration, tags) {
    let filter = getFilter(duration, tags);
    let query = ` ${appendPrefixes()}
                     SELECT DISTINCT ?id WHERE {
                            ?sub dc:identifier ?id ;
                            :durationNormalised ?duration ;
                            schema:keywords ?keywords ;
                            #FILTER (xsd:integer(?duration) > 1 && REGEX(?keywords, "alcohol", "i"))
                            ${filter}
                        }`
    let ids = await runQuery(query);
    ids = ids.map(x => x.get('id').value);
    var text = 'No text file found.';
    if(ids.length > 0){
        text = await getContentFromFileById(ids[0]);
    }
    return text;
} 

function getFilter(duration, tags){
    let filter = ' FILTER (';
    if(duration == '+20'){
        filter += `xsd:integer(?duration) >= 20`;
    }else{
        filter += `xsd:integer(?duration) = ${duration}`;
    }
    filter += ' && '
    ////////////////////
    let tagFilters = '('
    tags.forEach(tag => {
        if(tagFilters !== '('){
            tagFilters += ' || '
        }
        tagFilters += `REGEX(?keywords, "${tag.toLowerCase()}", "i")`
    });
    filter += tagFilters + ')';
    filter += ')';
    return filter;
}

async function getContentFromFileById(id) {
    // return new Promise((resolve, reject) => {

    // });
    let d = await fetch(`data/texts/${id} Preferred Format.txt`)
    let text = await d.text();
    return text;
}
////////////////////////////////////////////
async function getAllTags() {
    let query = ` ${appendPrefixes()}
                    SELECT DISTINCT ?keywords WHERE {
                        ?sub schema:keywords ?keywords .
                    }`
    let keywords = await runQuery(query);
    keywords = processKeywords(keywords.map(x => x.get('keywords').value));
    return keywords;
}

function appendPrefixes() {
    let prefixes = '';
    for (const [key, value] of Object.entries(allPrefixes)) {
        //console.log(`${key}: ${value}`);
        prefixes += `PREFIX ${key}: <${value}>\n`;
    }
    return prefixes;
}

// Function to process and clean keywords
function processKeywords(keywordsArray) {
    const allKeywords = keywordsArray
        .flatMap(item => item.split(",").map(keyword => keyword.trim()));  // Split and flatten the array
    const result = [...new Set(allKeywords)];
    return result;
}