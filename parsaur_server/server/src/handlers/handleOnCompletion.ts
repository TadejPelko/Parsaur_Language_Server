import { CompletionItem, CompletionItemKind, CompletionList, TextDocument, TextDocumentPositionParams, TextDocuments, VersionedTextDocumentIdentifier } from 'vscode-languageserver';

const regularExpressions = [
	{
		regex: /CREATE\s+TAG/g,
		name: "CREATE TAG"
	},
	{
		regex: /CREATE\s+BASE/g,
		name: "CREATE BASE"
	},
	{
		regex: /CREATE\s+LIST/g,
		name: "CREATE LIST"
	},
	{
		regex: /ADD\s+CONSTRUCTOR/g,
		name: "ADD CONSTRUCTOR"
	},
	{
		regex: /CREATE\s+LINK/g,
		name: "CREATE LINK"
	}
];

const regularExpressionsContext = [
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

/**
   * Searches for key words in the document refering to relevant context
   * 
   * @param documentPart - string of relevant part of document content
   * 
   * @returns Found key word
*/
function findKeyWordsContext(documentPart: string): string{
	let context = ""; 
	for (const regexp of regularExpressionsContext){
		if (regexp.regex.test(documentPart)){
			const ix = documentPart.indexOf(regexp.name);
            context = documentPart.substring(ix + regexp.name.length, documentPart.length-1);
			break;
		}
	}
	return context;
}

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
	for (const regexp of regularExpressions){
		if (regexp.regex.test(documentPart)){
			return regexp.name;
		}
	}
	return "";
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
   * Suggests relevant code completions.
   * 
   * @param documents - open documents in workspace
   * @param line - relevant line in document
   * @param context - use hierarchy context for code suggestions 
   * 
   * @returns code suggestion {@link CompletionList}
*/
function getInteliSenseSuggestions(documents:TextDocuments<TextDocument>, line = "", context=false): CompletionList {
	const allUris = documents.all();
	let dotHierarchy: any[] = [];
	if (context){
		dotHierarchy = line.split(".");
		dotHierarchy.pop();
	}
	const returnArray: CompletionList = {isIncomplete: true, items:[]};
	const possibleConstructors = []; // ["CREATE BASE ", "CREATE GRID "];
	for (const constructor of regularExpressionsContext)
		possibleConstructors.push(constructor['name']);
	
	for (const constructor of possibleConstructors){
		const searchTerm = constructor;
		for (const uri of allUris){
			const doc = documents.get(uri.uri)?.getText();
			if (doc){
				const documentLines = doc?.split('\n');
				for (let lineIx = 0; lineIx < documentLines.length; lineIx++){
					const ix = documentLines[lineIx].indexOf(searchTerm); 
					if (ix > -1){
						let documentUpToCurrentCharacter = "";
						const hoverLine = documentLines[lineIx].substring(0,ix);
						for (let i = 0; i<lineIx; i++){
							documentUpToCurrentCharacter += documentLines[i];
						}
						documentUpToCurrentCharacter += hoverLine;
						const openBracketArray = getOpenBrackets(documentUpToCurrentCharacter);
						const bracketSplitDocument = documentUpToCurrentCharacter.split(/\(|\)|\{|\}/);
						const termContext = [];
						for (let i = 0; i<openBracketArray.length; i++){
							const word = findKeyWordsContext(bracketSplitDocument[i]);
							if (openBracketArray[i]){
								termContext.push(word);
							}
						}
						if (arraysEqual(dotHierarchy, termContext)){
							const extractTerm = documentLines[lineIx].substring(ix + searchTerm.length, documentLines[lineIx].length-1);
							const split = extractTerm.split(" ");
							let extracted = split[0];
							if(extracted.endsWith(";"))
								extracted = extracted.slice(0,-1);
							returnArray.items.push(
								{
									label: extracted,
									kind: CompletionItemKind.Text,
									data: 0
								}
							);
						}
					}
				}
			}
		}
	}
	return returnArray;
}

/**
   * Suggests relevant code completions.
   * 
   * @param documents - open documents in workspace
   * 
   * @returns the completion handler
*/
export function getCompletionHandler(documents: TextDocuments<TextDocument>){
	return (_textDocumentPosition: TextDocumentPositionParams): CompletionList => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		const textUri = _textDocumentPosition.textDocument.uri;
		const { line, character } = _textDocumentPosition.position;
		const doc = documents.get(textUri)!;
		const text = doc.getText();
		const lines = text.split('\n');
		const hoverLine = lines[line].substring(0,character);
	
		// else we return the context based suggestions
		let documentUpToCurrentCharacter = "";
		for (let i = 0; i<line; i++){
			documentUpToCurrentCharacter += lines[i];
		}
		documentUpToCurrentCharacter += hoverLine;
		const openBracketArray = getOpenBrackets(documentUpToCurrentCharacter);
		const bracketSplitDocument = documentUpToCurrentCharacter.split(/\(|\)|\{|\}/);
		const keywords = [];
		for (let i = 0; i<openBracketArray.length; i++){
			const word = findKeyWords(bracketSplitDocument[i]);
			if (openBracketArray[i]){
				keywords.push(word);
			}
		}

		const returnArray: CompletionList = getInteliSenseSuggestions(documents); //Get top level definitions
		if (keywords[keywords.length - 1] == "ADD CONSTRUCTOR")
			returnArray.items.push(...[	
				{
					label: 'CREATE',
					kind: CompletionItemKind.Text,
					data: 6
				},
				{
					label: 'GRID',
					kind: CompletionItemKind.Text,
					data: 38
				},
				{
					label: 'BASE',
					kind: CompletionItemKind.Text,
					data: 3
				},
				{
					label: 'LIST',
					kind: CompletionItemKind.Text,
					data: 14
				},
				{
					label: 'General',
					kind: CompletionItemKind.Text,
					data: 8
				},
				{
					label: 'Optional',
					kind: CompletionItemKind.Text,
					data: 21
				},
				{
					label: 'ListItem',
					kind: CompletionItemKind.Text,
					data: 28
				},
				{
					label: 'ListDelimiter',
					kind: CompletionItemKind.Text,
					data: 27
				},
				{
					label: 'DisplayItem',
					kind: CompletionItemKind.Text,
					data: 39
				},
				{
					label: 'AS',
					kind: CompletionItemKind.Text,
					data: 16
				}
			]);

		else if (keywords[keywords.length - 1] == "CREATE TAG")
			returnArray.items.push(...[	
				{
					label: 'AS',
					kind: CompletionItemKind.Text,
					data: 16
				},
				{
					label: 'CREATE',
					kind: CompletionItemKind.Text,
					data: 6
				},
				{
					label: 'TAG',
					kind: CompletionItemKind.Text,
					data: 35
				}
			]);

		else if (keywords[keywords.length - 1] == "CREATE LINK")
			returnArray.items.push(...[	
				{
					label: 'AS',
					kind: CompletionItemKind.Text,
					data: 16
				},
				{
					label: 'CREATE',
					kind: CompletionItemKind.Text,
					data: 6
				},
				{
					label: 'ADD',
					kind: CompletionItemKind.Text,
					data: 5
				},
				{
					label: 'LINK',
					kind: CompletionItemKind.Text,
					data: 36
				}
			]);

		else
			returnArray.items.push(...[
				{
					label: 'CONSTRUCTOR',
					kind: CompletionItemKind.Text,
					data: 1
				},
				{
					label: 'CHARACTER',
					kind: CompletionItemKind.Text,
					data: 2
				},
				{
					label: 'BASE',
					kind: CompletionItemKind.Text,
					data: 3
				},
				{
					label: 'INT',
					kind: CompletionItemKind.Text,
					data: 4
				},
				{
					label: 'ADD',
					kind: CompletionItemKind.Text,
					data: 5
				},
				{
					label: 'CREATE',
					kind: CompletionItemKind.Text,
					data: 6
				},
				{
					label: 'IMPORT',
					kind: CompletionItemKind.Text,
					data: 7
				},
				{
					label: 'General',
					kind: CompletionItemKind.Text,
					data: 8
				},
				{
					label: 'Decorator',
					kind: CompletionItemKind.Text,
					data: 9
				},
				{
					label: 'DefaultItem',
					kind: CompletionItemKind.Text,
					data: 10
				},
				{
					label: 'CastItem',
					kind: CompletionItemKind.Text,
					data: 11
				},
				{
					label: 'ParallelDecorator',
					kind: CompletionItemKind.Text,
					data: 12
				},
				{
					label: 'Generator',
					kind: CompletionItemKind.Text,
					data: 13
				},
				{
					label: 'LIST',
					kind: CompletionItemKind.Text,
					data: 14
				},
				{
					label: 'None',
					kind: CompletionItemKind.Text,
					data: 15
				},
				{
					label: 'AS',
					kind: CompletionItemKind.Text,
					data: 16
				},
				{
					label: 'GeneralStrict',
					kind: CompletionItemKind.Text,
					data: 17
				},
				{
					label: 'Reference',
					kind: CompletionItemKind.Text,
					data: 18
				},
				{
					label: 'BreakItem',
					kind: CompletionItemKind.Text,
					data: 19
				},
				{
					label: 'DecoratorItem',
					kind: CompletionItemKind.Text,
					data: 20
				},
				{
					label: 'Optional',
					kind: CompletionItemKind.Text,
					data: 21
				},
				{
					label: 'OptionalGroup',
					kind: CompletionItemKind.Text,
					data: 22
				},
				{
					label: 'Input',
					kind: CompletionItemKind.Text,
					data: 23
				},
				{
					label: 'Output',
					kind: CompletionItemKind.Text,
					data: 24
				},
				{
					label: 'BreakPersist',
					kind: CompletionItemKind.Text,
					data: 25
				},
				{
					label: 'StopItem',
					kind: CompletionItemKind.Text,
					data: 26
				},
				{
					label: 'ListDelimiter',
					kind: CompletionItemKind.Text,
					data: 27
				},
				{
					label: 'ListItem',
					kind: CompletionItemKind.Text,
					data: 28
				},
				{
					label: 'ContainItem',
					kind: CompletionItemKind.Text,
					data: 29
				},
				{
					label: 'Rule',
					kind: CompletionItemKind.Text,
					data: 30
				},
				{
					label: 'Condition',
					kind: CompletionItemKind.Text,
					data: 31
				},
				{
					label: 'Display',
					kind: CompletionItemKind.Text,
					data: 32
				},
				{
					label: 'Remove',
					kind: CompletionItemKind.Text,
					data: 33
				},
				{
					label: 'Inherit',
					kind: CompletionItemKind.Text,
					data: 34
				},			
				{
					label: 'TAG',
					kind: CompletionItemKind.Text,
					data: 35
				},
				{
					label: 'LINK',
					kind: CompletionItemKind.Text,
					data: 36
				},
				{
					label: 'PYLINK',
					kind: CompletionItemKind.Text,
					data: 37
				},
				{
					label: 'GRID',
					kind: CompletionItemKind.Text,
					data: 38
				},
				{
					label: 'DisplayItem',
					kind: CompletionItemKind.Text,
					data: 39
				},
				{
					label: 'PROPERTY',
					kind: CompletionItemKind.Text,
					data: 40
				}
			]);
		return returnArray;
	};
}