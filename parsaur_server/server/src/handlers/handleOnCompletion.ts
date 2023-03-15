import { CompletionItem, CompletionItemKind, TextDocument, TextDocumentPositionParams, TextDocuments, VersionedTextDocumentIdentifier } from 'vscode-languageserver';

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

function getInteliSenseSuggestions(line:string, documents:TextDocuments<TextDocument>): any {
	const allUris = documents.all();
	const dotHierarchy = line.split(".");
	dotHierarchy.pop();
	const returnArray = [];
	let counter = 0;

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
					counter++;
					const ix = documentLines[lineIx].indexOf(searchTerm); 
					if (ix > -1){ // if the next character is an alphanumeric character then this is is a different definition with the same prefix -> could be irrelevant here, a copy legacy.
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
							const word = findKeyWordsContext(bracketSplitDocument[i]);
							if (openBracketArray[i]){
								context.push(word);
							}
						}
						if (arraysEqual(dotHierarchy, context)){
							const extractTerm = documentLines[lineIx].substring(ix + searchTerm.length, documentLines[lineIx].length-1);
							const split = extractTerm.split(" ");
							let extracted = split[0];
							if(extracted.endsWith(";"))
								extracted = extracted.slice(0,-1);
							returnArray.push(
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

function getTopLevelTerms(documents:TextDocuments<TextDocument>){
	const allUris = documents.all();
	const returnArray = [];
	let counter = 0;

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
					counter++;
					const ix = documentLines[lineIx].indexOf(searchTerm); 
					if (ix > -1){ // if the next character is an alphanumeric character then this is is a different definition with the same prefix -> could be irrelevant here, a copy legacy.
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
							const word = findKeyWordsContext(bracketSplitDocument[i]);
							if (openBracketArray[i]){
								context.push(word);
							}
						}
						if (arraysEqual([], context)){
							const extractTerm = documentLines[lineIx].substring(ix + searchTerm.length, documentLines[lineIx].length-1);
							const split = extractTerm.split(" ");
							let extracted = split[0];
							if(extracted.endsWith(";")) 
								extracted = extracted.slice(0,-1);
							returnArray.push(
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


export function getCompletionHandler(documents: TextDocuments<TextDocument>){
	return (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		const textUri = _textDocumentPosition.textDocument.uri;
		const { line, character } = _textDocumentPosition.position;
		const doc = documents.get(textUri)!;
		const text = doc.getText();
		const lines = text.split('\n');
		const hoverLine = lines[line].substring(0,character);

		// If last character is "." we deploy InteliSense
		const splitLine = hoverLine.split(" ");
		if (splitLine[splitLine.length - 1].includes(".")){
			const inteliSenseSuggestions = getInteliSenseSuggestions(splitLine[splitLine.length - 1], documents);
			return inteliSenseSuggestions;
		}
	
		// else we return the context based suggestions
		let documentUpToCurrentCharacter = "";
		for (let i = 0; i<line; i++){
			documentUpToCurrentCharacter += lines[i];
		}
		documentUpToCurrentCharacter += hoverLine;
		const openBracketArray = getOpenBrackets(documentUpToCurrentCharacter);
		const bracketSplitDocument = documentUpToCurrentCharacter.split(/\(|\)|\{|\}/);
		let return_res = "";
		const keywords = [];
		for (let i = 0; i<openBracketArray.length; i++){
			const word = findKeyWords(bracketSplitDocument[i]);
			if (openBracketArray[i]){
				keywords.push(word);
				return_res+= " | " + word;
			}
		}

		const returnArray = getTopLevelTerms(documents); //Get top level definitions

		if (keywords[keywords.length - 1] == "ADD CONSTRUCTOR")
			returnArray.push(...[	
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
			returnArray.push(...[	
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
			returnArray.push(...[	
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
			returnArray.push(...[
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