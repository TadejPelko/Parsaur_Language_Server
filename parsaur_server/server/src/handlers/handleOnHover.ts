import { Hover, HoverParams, TextDocument, TextDocuments } from 'vscode-languageserver';

 /**
   * Extracts the word of the character. 
   * 
   * @param str - string in which the word we want to extract is found
   * @param position - position of the character within the string
   * 
   * @returns The word of the character 
   */

function getWordAt(str: string, pos: number) {
    // Perform type conversions.
    str = String(str);
    pos = Number(pos) >>> 0;

    // Search for the word's beginning and end.
    var left = str.slice(0, pos + 1).search(/\w+$/),
        right = str.slice(pos).search(/\W/);

    // The last word in the string is a special case.
    if (right < 0) {
        return str.slice(left);
    }

    // Return the word, using the located bounds to extract it from the string.
    return str.slice(left, right + pos);
}

 /**
   * Provides details upon hovering.
   * 
   * @returns Funtion that returns the on-hover tooltip. 
   */

export function getHoverHandler(documents: TextDocuments<TextDocument>){
	return (params: HoverParams): Promise<Hover> => {
		const { textDocument } = params;
		const { line, character } = params.position
		const doc = documents.get(textDocument.uri)!;
		const text = doc.getText();
		
		const lines = text.split('\n');
		const hoverLine = lines[line];
		const word = getWordAt(hoverLine, character);
		return Promise.resolve({
		  contents: [word],
		});
	  }
}