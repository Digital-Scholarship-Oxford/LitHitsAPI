const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;
const store = new N3.Store();
var allPrefixes = {};
var isDataLoaded = false;
var SERVER_DATA_URL = 'https://digital-scholarship-oxford.github.io/LitHitsAPI/data';

/////////////////////////////////////////////////////////////////////////////////
async function loadData(file) {
    // Return a Promise that resolves when the data is loaded
    return new Promise((resolve, reject) => {
        $.ajaxSetup({ cache: false });
        $("#data").load(`${SERVER_DATA_URL}/${file}`, async function (responseTxt, statusTxt, xhr) {
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
    // var text = 'No text file found.';
    // if(ids.length > 0){
    //     text = await getContentFromFileById(ids[0]);
    // }
    // return text;
    return ids;
} 

async function getSurpriseText(duration) {
    let tags = await getRandomTags(duration);
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

async function getTitleById(id) {
    let query = ` ${appendPrefixes()}
                     SELECT DISTINCT ?title WHERE {
                            ?sub dc:title ?title ;
                            dc:identifier "${id}" ;
                        }`
    let titles = await runQuery(query);
    titles = titles.map(x => x.get('title').value);
    return titles[0];
} 

function getFilter(duration, tags, isRandom = false){
    let filter = ' FILTER (';
    if(duration == '+20'){
        filter += `xsd:integer(?duration) >= 20`;
    }else{
        filter += `xsd:integer(?duration) = ${duration}`;
    }

    if(!isRandom && tags !== null){
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
    }

    filter += ')';

    return filter;
}

async function getContentFromFileById(id) {
    let d = await fetch(`${SERVER_DATA_URL}/texts/${id} Preferred Format.txt`)
    let text = await d.text();
    if(text.includes("File not found")){
        return "No text file found.";
    }
    return text;
}
////////////////////////////////////////////
async function getAllTags(duration) {
    let filter = getFilter(duration, null, true);
    let query = ` ${appendPrefixes()}
                    SELECT DISTINCT ?keywords WHERE {
                        ?sub schema:keywords ?keywords ;
                        :durationNormalised ?duration ;
                        ${filter}
                    }`
    let keywords = await runQuery(query);
    keywords = processKeywords(keywords.map(x => x.get('keywords').value));
    return keywords;
}

async function getRandomTags(duration) {
    let filter = getFilter(duration, null, true); 
    let query = ` ${appendPrefixes()}
                    SELECT DISTINCT ?keywords WHERE {
                        ?sub schema:keywords ?keywords ;
                        :durationNormalised ?duration ;
                        ${filter}
                    }`
    let tags = await runQuery(query);
    tags = processKeywords(tags.map(x => x.get('keywords').value));

    let randomTags = selectRandomTags(2, tags);
    return randomTags;
}

// Method to select random tags
function selectRandomTags(numTags = 2, tags) {
  if (numTags < 2) numTags = 2; // Ensure at least two words are selected

  let selectedTags = [];
  // Shuffle the list randomly
  const shuffled = [...tags];  // Create a copy to shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }

  // Select the first 'numTags' elements after shuffling
  selectedTags = shuffled.slice(0, numTags);
  return selectedTags;
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