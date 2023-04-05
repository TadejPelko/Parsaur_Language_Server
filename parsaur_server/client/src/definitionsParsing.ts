import * as vscode from 'vscode';
import * as fs from 'fs';

const regularExpressions= [
	{
		regex: /CREATE\s+TAG/g,
		name: "CREATE TAG "
	},
	{
		regex: /CREATE\s+BASE/g,
		name: "CREATE BASE "
	},
	{
		regex: /CREATE\s+GRID/g,
		name: "CREATE GRID "
	}
];

export function parseDefinitions(){
	const definitionsDictionary = {};
	vscode.workspace.findFiles('**/{*.mql}', null, 1000).then((uris: vscode.Uri[] ) => {      
		uris.forEach((uri: vscode.Uri) => { 
			console.log("FILE", uri);  
			const split = uri.path.split('/');
			split.shift(); // remove the unnecessary "c:"
			fs.readFile(split.join("/"), (err, data) => {
				if (err) throw err;
				const doc = data.toString();
				const context = [];
				const dictionaryKeyContext = [];
				if (doc){
					const documentLines = doc?.split('\n');
					for (let lineIx = 0; lineIx < documentLines.length; lineIx++){
						for (const expression of regularExpressions){
							const searchTerm = expression.name;
							const termIx = documentLines[lineIx].indexOf(searchTerm); // This is also hierarchy depth if we assume that characters before the search term are \t
							if (termIx > -1){
								const extractTerm = documentLines[lineIx].substring(termIx + searchTerm.length, documentLines[lineIx].length-1);
								const split = extractTerm.split(" ");
								let extractedName = split[0];
								if (extractedName.endsWith(";") || extractedName.endsWith("{"))
									extractedName = extractedName.slice(0,-1);
																
								const contextLength = context.length; 
								for (let i = 0; i < contextLength - termIx / 4; i++){ // update hierarchy depth based on number of used \t -> ONE \T IS 4 CHARACTERS
									context.pop();
									dictionaryKeyContext.pop();
								}
								let definitionKey = context.join(".") + "." + extractedName + "_" + uri;
								if (context.length == 0)
									definitionKey = definitionKey.substring(1, definitionKey.length -1);
								definitionsDictionary[definitionKey] = {
									name: extractedName,
									context: context.join("."),
									fileName: uri,
									lineIndex: lineIx,
									children: [],
									imports: []
								};
								for (const dKey of dictionaryKeyContext){ // add children
									definitionsDictionary[dKey]["children"].push(extractedName);
								}
								context.push(extractedName);
								dictionaryKeyContext.push(definitionKey);
								console.log(definitionsDictionary);
							}
						}
					}
				}
			});
			return definitionsDictionary;

		}); // open file
	}); 
	console.log("Finished parsing definitions");
	return definitionsDictionary;
}