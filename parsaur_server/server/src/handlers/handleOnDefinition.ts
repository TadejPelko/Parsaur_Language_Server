import { Definition, DefinitionParams, Location, TextDocument, TextDocuments } from "vscode-languageserver";

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
    var left = str.slice(0, pos + 1).search(/(\w|\.)+$/),
        right = str.slice(pos).search(/\W/);

    // The last word in the string is a special case.
    if (right < 0) {
        return str.slice(left);
    }

    // Return the word, using the located bounds to extract it from the string.
    return str.slice(left, right + pos);
}

export function getOnDefinitionHandler(documents: TextDocuments<TextDocument>){
    return (params: DefinitionParams) =>{
        const doc = documents.get(params.textDocument.uri)!;
		const text = doc.getText();
		const lines = text.split('\n');
		const hoverLine = lines[params.position.line];
        const sequence = getSequenceAt(hoverLine, params.position.character); // word for definition search
        const sequenceSplit = sequence.split(".");
        const term = sequenceSplit[sequenceSplit.length - 1];

        const allUris = documents.all();

        let targetUri = "";
        let targetLine = -1;
        let targetCharacter = -1;
        let searchTermLength = -1;
        const possibleConstructors = ["CREATE BASE ", "CREATE GRID "]
        for (let constructor of possibleConstructors){
            const searchTerm = constructor + term;
            searchTermLength = searchTerm.length;
            for (let uri of allUris){
                const doc = documents.get(uri.uri)?.getText();
                if (doc){
                    const documentLines = doc?.split('\n');
                    for (let lineIx = 0; lineIx < documentLines.length; lineIx++){
                        const ix = documentLines[lineIx].indexOf(searchTerm); 
                        if (ix > -1 && documentLines[lineIx][ix + searchTerm.length].match(/\W/)){ // if the next character is an alphanumeric character then this is is a different definition with the same prefix
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
        if (targetUri != "")
            return Location.create(targetUri, {
                start: { line: targetLine, character: targetCharacter },
                end: { line: targetLine, character: targetCharacter + searchTermLength }
            });
    }
        
}