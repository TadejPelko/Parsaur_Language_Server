import { Definition, DefinitionParams, Location, TextDocument, TextDocuments } from "vscode-languageserver";

const regularExpressions = [
	{
		regex: /CREATE\s+TAG/g,
		name: "CREATE TAG "
	},
	{
		regex: /CREATE\s+BASE/g,
		name: "CREATE BASE "
	},
	{
		regex: /CREATE\s+LIST/g,
		name: "CREATE LIST "
	},
	{
		regex: /ADD\s+CONSTRUCTOR/g,
		name: "ADD CONSTRUCTOR "
	},
	{
		regex: /CREATE\s+LINK/g,
		name: "CREATE LINK "
	},
	{
		regex: /CREATE\s+GRID/g,
		name: "CREATE GRID "
	}
];

const openBrackets = ['(', '{'];
const closedBrackets = [')', '}'];

/**
   * Finds out which brackets in document are open at the typing position  
   * 
   * @param documentString - string of document content
   * 
   * @returns Array of booleans representing the open/closed (true/false) state of brackets in content 
*/
function getOpenBrackets(documentString: string): boolean[]{
	const bracketArray = [];
	const stack = [];
	let bracketIx = 0;
	for (let i = 0; i < documentString.length; i++){
		const char = documentString.charAt(i);
		if (openBrackets.indexOf(char) !== -1){
			bracketArray.push(true);
			stack.push({
				bracket: char,
				index: bracketIx
			});
			bracketIx++;
		}
		if (closedBrackets.indexOf(char) !== -1){
			bracketIx++;
			bracketArray.push(false);
			if (stack[stack.length - 1]['bracket'] === openBrackets[closedBrackets.indexOf(char)]){
				bracketArray[stack[stack.length - 1]['index']] = false;
				stack.pop();
			}
		}
	}

	return bracketArray;
}

/**
   * Searches for key words in the document
   * 
   * @param documentPart - string of relevant part of document content
   * 
   * @returns Found key word
*/
function findKeyWords(documentPart: string): string{
	let context = ""; 
	for (const regexp of regularExpressions){
		if (regexp.regex.test(documentPart)){
			const ix = documentPart.indexOf(regexp.name);
            context = documentPart.substring(ix + regexp.name.length, documentPart.length-1);
			break;
		}
	}
	return context;
}


/**
   * Extracts the word of the character. 
   * 
   * @param str - string in which the word we want to extract is found
   * @param position - position of the character within the string
   * 
   * @returns The word of the character 
*/
function getSequenceAt(str: string, pos: number) {
    // Perform type conversions.
    str = String(str);
    pos = Number(pos) >>> 0;

    // Search for the word's beginning and end.
    const left = str.slice(0, pos + 1).search(/(\w|\.)+$/),
        right = str.slice(pos).search(/\W/);

    // The last word in the string is a special case.
    if (right < 0) {
        return str.slice(left);
    }

    // Return the word, using the located bounds to extract it from the string.
    return str.slice(left, right + pos);
}

function arraysEqual(a:any[], b:any[]) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

/**
   * Finds the requested definition of a term.
   * 
   * @param documents - open documents in workspace
   * 
   * @returns the definitions handler
*/
export function getOnDefinitionHandler(documents: TextDocuments<TextDocument>){
    return (params: DefinitionParams) =>{
        const doc = documents.get(params.textDocument.uri)!;
		const text = doc.getText();
		const lines = text.split('\n');
		const hoverLine = lines[params.position.line];
        const sequence = getSequenceAt(hoverLine, params.position.character); // word for definition search
        const sequenceSplit = sequence.split(".");
        const term = sequenceSplit.pop();

        const allUris = documents.all();

        let targetUri = "";
        let targetLine = -1;
        let targetCharacter = -1;
        let searchTermLength = -1;
        const possibleConstructors = []; // ["CREATE BASE ", "CREATE GRID "];
        for (const constructor of regularExpressions)
            possibleConstructors.push(constructor['name']);
        for (const constructor of possibleConstructors){
            const searchTerm = constructor + term;
            searchTermLength = searchTerm.length;
            for (const uri of allUris){
                const doc = documents.get(uri.uri)?.getText();
                if (doc){
                    const documentLines = doc?.split('\n');
                    for (let lineIx = 0; lineIx < documentLines.length; lineIx++){
                        const ix = documentLines[lineIx].indexOf(searchTerm); 
                        if (ix > -1 && documentLines[lineIx][ix + searchTerm.length].match(/\W/)){ // if the next character is an alphanumeric character then this is is a different definition with the same prefix
                            let documentUpToCurrentCharacter = "";
                            const hoverLine = documentLines[lineIx].substring(0,ix);
                            for (let i = 0; i<lineIx; i++){
                                documentUpToCurrentCharacter += documentLines[i];
                            }
                            documentUpToCurrentCharacter += hoverLine;
                            const openBracketArray = getOpenBrackets(documentUpToCurrentCharacter);
                            const bracketSplitDocument = documentUpToCurrentCharacter.split(/\(|\)|\{|\}/);
                            const context = [];
                            for (let i = 0; i<openBracketArray.length; i++){
                                const word = findKeyWords(bracketSplitDocument[i]);
                                if (openBracketArray[i])
                                    context.push(word);
                            }
                            if (arraysEqual(sequenceSplit, context)){
                                targetUri = uri.uri;
                                targetLine = lineIx;
                                targetCharacter = ix;
                                break;
                            }
                        }
                    }
                }
                if(targetLine > -1)
                    break;
            }
            if(targetLine > -1)
                break;
        }
        if (targetUri != "")
            return Location.create(targetUri, {
                start: { line: targetLine, character: targetCharacter },
                end: { line: targetLine, character: targetCharacter + searchTermLength }
            });
    };  
}