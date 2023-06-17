import * as vscode from 'vscode';
import * as fs from 'fs';


export async function refreshDiagnostics(suggestionsDictionary, collection: vscode.DiagnosticCollection) {
	console.log("Beginning diagnostics");
	collection.clear();
	const diagnostics: vscode.Diagnostic[] = [];
	const uris = await vscode.workspace.findFiles('**/{*.mql}');
	for (const uri of uris){
		const split = uri.path.split('/');
		split.shift(); // remove the unnecessary "c:"
		await fs.promises.readFile(split.join("/")).then((res) => { 	//	This might be changed to parallel
			const doc = res.toString();
			res
			if (doc){
				const documentLines = doc?.split('\n');
				for (let lineIx = 0; lineIx < documentLines.length; lineIx++){
					const ix = documentLines[lineIx].indexOf("?");
					if (ix > -1){
						const term = getSequenceAt(documentLines[lineIx], ix + 1);
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
								new vscode.Diagnostic(range, uri + term, vscode.DiagnosticSeverity.Error)
							);
						}
					}
				}
			}
		});
		collection.set(uri,diagnostics);
	}
	console.log("Finishing diagnostics");
}

/**
   * Extracts the word of the character (allowing "."). 
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
        right = str.slice(pos).search(/( |\(|\)|\t|\,|\;)+/);

    // The last word in the string is a special case.
    if (right < 0) {
        return str.slice(left);
    }

    // Return the word, using the located bounds to extract it from the string.
    return str.slice(left, right + pos);
}
