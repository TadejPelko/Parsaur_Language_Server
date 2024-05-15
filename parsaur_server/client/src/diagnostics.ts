import * as vscode from 'vscode';
import * as fs from 'fs';

const SINGLE_LINE_COMMENT_CHARACTER = "//";
const MULTI_LINE_COMMENT_CHARACTER_OPEN = "/*";
const MULTI_LINE_COMMENT_CHARACTER_CLOSE = "*/";

/**
   * Checks for falsely written definitions in all files. Diagnostics are reported as "problems" to the user.  
   * 
   * @param suggestionsDictionary - dictionary of defined terms (definitions)
   * @param collection - collection of diagnostics shown to the user
*/
export async function refreshDiagnostics(suggestionsDictionary, collection: vscode.DiagnosticCollection) {
	console.log("Beginning diagnostics");
	collection.clear();
	const uris = await vscode.workspace.findFiles('**/{*.mql}');
	for (const uri of uris){
		const split = uri.path.split('/');
		split.shift(); // remove the unnecessary "c:"
		await fs.promises.readFile(split.join("/")).then((res) => { 	//	This might be changed to parallel
			const doc = res.toString();
			res
			if (doc){
				const diagnostics: vscode.Diagnostic[] = [];
				const documentLines = doc?.split('\n');
				let ignoreLineDueToComment = false;
				for (let lineIx = 0; lineIx < documentLines.length; lineIx++){
					let currentLine = documentLines[lineIx];
					// Check for comment characters
					if (ignoreLineDueToComment){
						const multi_line_comment_close_char_ix = currentLine.indexOf(MULTI_LINE_COMMENT_CHARACTER_CLOSE);
						if (multi_line_comment_close_char_ix > -1){ //line contains the end of multi-line comment
							currentLine = currentLine.substring(multi_line_comment_close_char_ix, currentLine.length);
							ignoreLineDueToComment = false;
						}else
							continue; // line is commented
					}
					const multi_line_comment_open_char_ix = currentLine.indexOf(MULTI_LINE_COMMENT_CHARACTER_OPEN);
					if (multi_line_comment_open_char_ix > -1){
						currentLine = currentLine.substring(0, multi_line_comment_open_char_ix);
						ignoreLineDueToComment = true;
					}
					const single_line_comment_char_ix = currentLine.indexOf(SINGLE_LINE_COMMENT_CHARACTER);
					if (single_line_comment_char_ix > -1){
						currentLine = currentLine.substring(0, single_line_comment_char_ix);
					}
					const ix = currentLine.indexOf("?"); //Hierarchy terms always start with '?'
					if (ix > -1){
						const term = getSequenceAt(currentLine, ix + 1);
						let found = false;
						for (const entry in suggestionsDictionary){
							if (suggestionsDictionary[entry]["fullName"] == term){
								found = true;
								break;
							}
						}
						if (!found){
							const range = new vscode.Range(lineIx, ix, lineIx, ix + term.length);
							diagnostics.push(
								new vscode.Diagnostic(range, "Term: " + term + " is invalid!", vscode.DiagnosticSeverity.Error)
							);
						}
					}
				}
				collection.set(uri,diagnostics);
			}
		});
	}
	console.log("Finishing diagnostics");
}

/**
   * Extracts the word of the character but allowing "." (for full path definitions).  
   * 
   * @param str - string in which the word we want to extract is found
   * @param position - position of the character within the string
   * 
   * @returns The word of the character 
*/
function getSequenceAt(str: string, pos: number): string {
    // Perform type conversions.
    str = String(str);
    pos = Number(pos) >>> 0;

    // Search for the word's beginning and end.
    const left = str.slice(0, pos + 1).search(/(\w|\.)+$/),
        right = str.slice(pos).search(/( |\(|\)|\t|\,|\;|\n|\r|\r\n)+/);

    // The last word in the string is a special case.
    if (right < 0) {
        return str.slice(left);
    }

    // Return the word, using the located bounds to extract it from the string.
    return str.slice(left, right + pos);
}
