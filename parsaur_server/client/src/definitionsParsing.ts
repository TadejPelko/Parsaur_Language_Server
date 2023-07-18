import * as vscode from 'vscode';
import * as fs from 'fs';

const regularExpressions= [
	{
		regex: /CREATE\s+TAG/g,
		name: "CREATE TAG "
	},
	{
		regex: /CREATE\s+INT/g,
		name: "CREATE INT "
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
const SINGLE_LINE_COMMENT_CHARACTER = "//";
const MULTI_LINE_COMMENT_CHARACTER_OPEN = "/*";
const MULTI_LINE_COMMENT_CHARACTER_CLOSE = "*/";

 /**
   * Creates a dictionary of definitions. 
   * 
   * @returns Dictionary of definitions
   */
export async function getDefinitions(){
	const res = await parseDefinitions();
	return postProcessingDefinitions(res);
}

 /**
   * Creates a code action quick fix. 
   * 
   * @param context - Array of parent definitions
   * @param extractedName - Name of the definiton
   * @param uri - Uri of the file where the definition was found
   * 
   * @returns Dictionary key for the definitions.
   */
export function constructDictionaryKey(context, extractedName: string, uri: vscode.Uri){
	let definitionKey = context.join(".") + "." + extractedName + "_" + uri;
	if (context.length == 0)
		definitionKey = definitionKey.substring(1, definitionKey.length -1);
	return definitionKey;
}


 /**
   * Iterates over local .mql files and parses definitons. 
   * 
   * @returns Definitions dictionary.
   */
export async function parseDefinitions(){
	console.log("Beginning parsing");
	const definitionsDictionary: {[key: string]: DefinitionEntry} = {};
	const uris = await vscode.workspace.findFiles('**/{*.mql}');
	for (const uri of uris){
		const split = uri.path.split('/');
		split.shift(); // remove the unnecessary "c:"
		await fs.promises.readFile(split.join("/")).then((res) => { 	//	This might be changed to parallel
			const doc = res.toString();
			const context = [];
			const dictionaryKeyContext = [];
			let ignoreLineDueToComment = false;
			let openBracketStack = [] //true means context bracket, false means a constructor bracket
			let contextBracket = false;
			let lastExtractedName = "";
			let lastDictionaryKey = "";
			if (doc){
				const documentLines = doc?.split('\n');
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

					// check for '}' context closing
					const splitByContextClosings = currentLine.split('}');
					for (let i = 0; i<splitByContextClosings.length; i++){
						// check for '{' context open
						const splitByContextOpens = splitByContextClosings[i].split('{');
						for (let j = 0; j<splitByContextOpens.length; j++){
							currentLine = splitByContextOpens[j];
							const importIx = currentLine.indexOf(IMPORT_STATEMENT);
							if (importIx > -1){
								const spaceSplit = currentLine.split(' ');
								while (spaceSplit[spaceSplit.length - 1] === '')
									spaceSplit.pop(); //remove unnecesarry spaces
								let importTerm = spaceSplit[spaceSplit.length - 1];
								while (importTerm.endsWith(';') || importTerm.endsWith('\r'))
									importTerm = importTerm.slice(0,-1);
								if (dictionaryKeyContext.length > 0){
									const splitUri = uri.path.split('/');
									splitUri.pop();
									let replaced = importTerm.replace('\\', '/');
									replaced = replaced.trim();
									if (replaced.endsWith(';'))
										replaced = replaced.slice(0,-1);

									const fullPath = splitUri.join('/') + "/" + replaced;
									definitionsDictionary[dictionaryKeyContext[dictionaryKeyContext.length - 1]].imports.push(fullPath);
								}
							} else {
								// Special children using "?"
								const trimmedLine = currentLine.trim();
								let extractedName = "";
								let termIx = -1;
								let special = false;
								if (trimmedLine.startsWith("?")){
									special = true;
									termIx = currentLine.indexOf("?");
									if (trimmedLine.indexOf(" AS ") > -1){
										const splittedByAs = trimmedLine.split(" AS "); // I assume there is only one "AS"
										const asTerm = splittedByAs[splittedByAs.length - 1]; // split by { and ' '
										extractedName = getSequenceAt(asTerm, 0);
									}else{
										const splittedByDot = trimmedLine.split(".");
										extractedName = getSequenceAt(splittedByDot[splittedByDot.length - 1], 0);
									}
								}
								if (!special){
									// Regular expressions search for children
									for (const expression of regularExpressions){
										const searchTerm = expression.name;
										termIx = currentLine.indexOf(searchTerm); // This is also hierarchy depth if we assume that characters before the search term are \t
										if (termIx > -1){
											const extractTerm = currentLine.substring(termIx + searchTerm.length, currentLine.length);
											const split = extractTerm.split(/\(| /);
											extractedName = split[0];
											while (extractedName.endsWith(';') || extractedName.endsWith('{') || extractedName.endsWith('\r') || extractedName.endsWith('\t') || extractedName.endsWith('\n'))
												extractedName = extractedName.slice(0,-1);
											break;
										} 			
									}	// searching regular expressions	
								}
								if (termIx > -1){
									const topLevel = context.length == 0;
									const definitionKey = constructDictionaryKey(context, extractedName, uri);
									const newEntry = new DefinitionEntry(
										extractedName,
										context.join("."),
										topLevel,
										uri.path,
										[],
										[],
										[],
										lineIx,
										termIx
									);
									definitionsDictionary[definitionKey] = newEntry;
									// add children
									if (dictionaryKeyContext.length > 0){
										definitionsDictionary[dictionaryKeyContext[dictionaryKeyContext.length - 1]].children.push(extractedName);
										definitionsDictionary[dictionaryKeyContext[dictionaryKeyContext.length - 1]].childrenEntries.push(newEntry);
									}
									if (!special){
										lastExtractedName = extractedName;
										lastDictionaryKey = definitionKey;
									}
									contextBracket = true;
								}		 
							}
							if (j != splitByContextOpens.length - 1){
								openBracketStack.push(contextBracket);
								if (contextBracket){
									context.push(lastExtractedName);
									dictionaryKeyContext.push(lastDictionaryKey);	
								}
								contextBracket = false;
							}
						} // context open
						if (i != splitByContextClosings.length - 1){
							const isContext = openBracketStack.pop();
							if (isContext){
								// Pop context
								context.pop();
								dictionaryKeyContext.pop();
							}
						}
					} // context closing 
				}
			}
		});
	} // open file
	console.log("Finished parsing definitions");
	return definitionsDictionary;
}

 /**
   * Processes the parsed definitions, handling imports. 
   * 
   * @param definitionsDictionary - Definitions dictionary
   * 
   * @returns Corrected (processed) definitions dictionary.
   */
export function postProcessingDefinitions(definitionsDictionary: {[key: string]: DefinitionEntry}){ //Replaces imports with children - top level definitions of imported file
	console.log("Beginning post-parsing procedure");
	for (const keyName in definitionsDictionary){
		for (const importName of definitionsDictionary[keyName].imports){
			for (const keyNameImport in definitionsDictionary){
				if (definitionsDictionary[keyNameImport].fileName == importName && definitionsDictionary[keyNameImport].isTopLevel){
					definitionsDictionary[keyName].children.push(definitionsDictionary[keyNameImport].name);
					definitionsDictionary[keyName].childrenEntries.push(definitionsDictionary[keyNameImport]);
					recursivelyAddContext(definitionsDictionary, definitionsDictionary[keyNameImport], keyName);
				}
			}
		}
	}

	for (const keyName in definitionsDictionary){
		if (definitionsDictionary[keyName].context != '')
			definitionsDictionary[keyName].fullName = definitionsDictionary[keyName].context + "." + definitionsDictionary[keyName].name; 
		else
			definitionsDictionary[keyName].fullName = definitionsDictionary[keyName].name; 
	}
	console.log("Finished post-parsing procedure");
	return definitionsDictionary;
}

 /**
   * Adds context to definitions using recursion. 
   * 
   * @param definitionsDictionary - Definitions dictionary
   * @param importEntry - Imported definition entry
   * @param keyName Dictionary key of importing definition
   * 
   * @returns Definitions dictionary.
   */
export function recursivelyAddContext(definitionsDictionary: {[key: string]: DefinitionEntry}, importEntry: DefinitionEntry, keyName: string){
	if (importEntry.context != '' && definitionsDictionary[keyName].context != '')
		importEntry.context = definitionsDictionary[keyName].context + "." + definitionsDictionary[keyName].name + "." + importEntry.context;
	else if (importEntry.context == '' && definitionsDictionary[keyName].context != '')
		importEntry.context = definitionsDictionary[keyName].context + "." + definitionsDictionary[keyName].name;
	else if (importEntry.context != '' && definitionsDictionary[keyName].context == '')
		importEntry.context = definitionsDictionary[keyName].name  + "." + importEntry.context;
	else // if (definitionsDictionary[keyNameImport]['context'] == '' && definitionsDictionary[keyName]['context'] == '')
		importEntry.context = definitionsDictionary[keyName].name;

	for (const child of importEntry.childrenEntries)
		definitionsDictionary = recursivelyAddContext(definitionsDictionary, child, keyName);
	return definitionsDictionary;
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

export class DefinitionEntry {
	constructor(
		public name: string,
		public context: string,
		public isTopLevel: boolean,
		public fileName: string,
		public children: string[],
		public childrenEntries: DefinitionEntry[],
		public imports: string[],
		public line: number,
		public character: number,
		public fullName = ""
	){}
}