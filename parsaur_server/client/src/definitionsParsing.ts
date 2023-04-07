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
const IMPORT_STATEMENT = "IMPORT";
const TAB_TO_SPACE_CONVERSION = 4;

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
						const importIx = documentLines[lineIx].indexOf(IMPORT_STATEMENT);
						if (importIx > -1){
							const contextLength = context.length; 
							let whiteCharacters = TAB_TO_SPACE_CONVERSION; // 4 spaces equal to one \t
							if (documentLines[lineIx].startsWith('\t'))
								whiteCharacters = 1;
							for (let i = 0; i < contextLength - importIx / whiteCharacters; i++){ // update hierarchy depth based on number of used \t -> ONE \T IS 4 CHARACTERS
								context.pop();
								dictionaryKeyContext.pop();
							}
							const spaceSplit = documentLines[lineIx].split(' ');
							while (spaceSplit[spaceSplit.length - 1] === '')
								spaceSplit.pop(); //remove unnecesarry spaces
							let importTerm = spaceSplit[spaceSplit.length - 1];
							while (importTerm.endsWith(';') || importTerm.endsWith('\r'))
								importTerm = importTerm.slice(0,-1);
							if (dictionaryKeyContext.length > 0)
								definitionsDictionary[dictionaryKeyContext[dictionaryKeyContext.length - 1]]["imports"].push(importTerm);
						} else {
							for (const expression of regularExpressions){
								const searchTerm = expression.name;
								const termIx = documentLines[lineIx].indexOf(searchTerm); // This is also hierarchy depth if we assume that characters before the search term are \t
								if (termIx > -1){
									const extractTerm = documentLines[lineIx].substring(termIx + searchTerm.length, documentLines[lineIx].length-1);
									const split = extractTerm.split(" ");
									let extractedName = split[0];
									while (extractedName.endsWith(';') || extractedName.endsWith('{') || extractedName.endsWith('\r'))
										extractedName = extractedName.slice(0,-1);
																	
									const contextLength = context.length;
									let whiteCharacters = TAB_TO_SPACE_CONVERSION; // 4 spaces equal to one \t
									if (documentLines[lineIx].startsWith('\t'))
										whiteCharacters = 1;
									for (let i = 0; i < contextLength - termIx / whiteCharacters; i++){ // update hierarchy depth based on number of used \t -> ONE \T IS 4 CHARACTERS
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
									// add children
									if (dictionaryKeyContext.length > 0)
										definitionsDictionary[dictionaryKeyContext[dictionaryKeyContext.length - 1]]["children"].push(extractedName);
									
									context.push(extractedName);
									dictionaryKeyContext.push(definitionKey);
									console.log(definitionsDictionary);
								}
							}
						} // searching regular expressions 
					}
				}
			});
		}); // open file
	});
	// console.log("Beginning post-parsing procedure");
	// for (const keyName in definitionsDictionary){
	// 	for (const importName of definitionsDictionary[keyName]['imports']){
	// 		console.log();
	// 	}
	// }
	console.log("Finished parsing definitions");
	return definitionsDictionary;
}