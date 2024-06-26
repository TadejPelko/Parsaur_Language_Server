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
const openBrackets = ['(', '{'];
const closedBrackets = [')', '}'];

const CONSTRUCTOR = 
{
	label: 'CONSTRUCTOR',
	kind: CompletionItemKind.Text,
	data: 1
};
const CHARACTER = 
{
	label: 'CHARACTER',
	kind: CompletionItemKind.Text,
	data: 2
};
const BASE =
{
	label: 'BASE',
	kind: CompletionItemKind.Text,
	data: 3
};
const INT = 
{
	label: 'INT',
	kind: CompletionItemKind.Text,
	data: 4
};
const ADD = 
{
	label: 'ADD',
	kind: CompletionItemKind.Text,
	data: 5
};
const CREATE = 
{
	label: 'CREATE',
	kind: CompletionItemKind.Text,
	data: 6
};
const IMPORT = {
	label: 'IMPORT',
	kind: CompletionItemKind.Text,
	data: 7
};
const GENERAL = 
{
	label: 'General',
	kind: CompletionItemKind.Text,
	data: 8
};
const DECORATOR = 
{
	label: 'Decorator',
	kind: CompletionItemKind.Text,
	data: 9
};
const DEFAULTITEM = 
{
	label: 'DefaultItem',
	kind: CompletionItemKind.Text,
	data: 10
};
const CASTITEM =
{
	label: 'CastItem',
	kind: CompletionItemKind.Text,
	data: 11
};
const PARALLELDECORATOR =
{
	label: 'ParallelDecorator',
	kind: CompletionItemKind.Text,
	data: 12
};
const GENERATOR =
{
	label: 'Generator',
	kind: CompletionItemKind.Text,
	data: 13
};
const LIST =
{
	label: 'LIST',
	kind: CompletionItemKind.Text,
	data: 14
};
const NONE =
{
	label: 'None',
	kind: CompletionItemKind.Text,
	data: 15
};
const AS =
{
	label: 'AS',
	kind: CompletionItemKind.Text,
	data: 16
};
const GENERALSTRICT =
{
	label: 'GeneralStrict',
	kind: CompletionItemKind.Text,
	data: 17
};
const REFERENCE =
{
	label: 'Reference',
	kind: CompletionItemKind.Text,
	data: 18
};
const BREAKITEM = 
{
	label: 'BreakItem',
	kind: CompletionItemKind.Text,
	data: 19
};
const DECORATORITEM =
{
	label: 'DecoratorItem',
	kind: CompletionItemKind.Text,
	data: 20
};
const OPTIONAL = 
{
	label: 'Optional',
	kind: CompletionItemKind.Text,
	data: 21
};
const OPTIONALGROUP = 
{
	label: 'OptionalGroup',
	kind: CompletionItemKind.Text,
	data: 22
};
const INPUT = 
{
	label: 'Input',
	kind: CompletionItemKind.Text,
	data: 23
};
const OUTPUT =
{
	label: 'Output',
	kind: CompletionItemKind.Text,
	data: 24
};
const BREAKPERSIST = 
{
	label: 'BreakPersist',
	kind: CompletionItemKind.Text,
	data: 25
};
const STOPITEM =
{
	label: 'StopItem',
	kind: CompletionItemKind.Text,
	data: 26
};
const LISTDELIMITER = 
{
	label: 'ListDelimiter',
	kind: CompletionItemKind.Text,
	data: 27
};
const LISTITEM = 
{
	label: 'ListItem',
	kind: CompletionItemKind.Text,
	data: 28
};
const CONTAINITEM = 
{
	label: 'ContainItem',
	kind: CompletionItemKind.Text,
	data: 29
};
const RULE  =
{
	label: 'Rule',
	kind: CompletionItemKind.Text,
	data: 30
};
const CONDITION = 
{
	label: 'Condition',
	kind: CompletionItemKind.Text,
	data: 31
};
const DISPLAY = 
{
	label: 'Display',
	kind: CompletionItemKind.Text,
	data: 32
};
const REMOVE = 
{
	label: 'Remove',
	kind: CompletionItemKind.Text,
	data: 33
};
const INHERIT = 
{
	label: 'Inherit',
	kind: CompletionItemKind.Text,
	data: 34
};
const TAG = 
{
	label: 'TAG',
	kind: CompletionItemKind.Text,
	data: 35
};
const LINK = 
{
	label: 'LINK',
	kind: CompletionItemKind.Text,
	data: 36
};
const PYLINK = 
{
	label: 'PYLINK',
	kind: CompletionItemKind.Text,
	data: 37
};
const GRID =
{
	label: 'GRID',
	kind: CompletionItemKind.Text,
	data: 38
};
const DISPLAYITEM = 
{
	label: 'DisplayItem',
	kind: CompletionItemKind.Text,
	data: 39
};
const PROPERTY = 
{
	label: 'PROPERTY',
	kind: CompletionItemKind.Text,
	data: 40
};
const LINKGROUP = 
{
	label: 'LINK_GROUP',
	kind: CompletionItemKind.Text,
	data: 41
};
const PARSE = 
{
	label: 'PARSE',
	kind: CompletionItemKind.Text,
	data: 42
};
const SKIP = 
{
	label: 'SKIP',
	kind: CompletionItemKind.Text,
	data: 43
};
const BIND = 
{
	label: 'BIND',
	kind: CompletionItemKind.Text,
	data: 44
};
const PARENT = 
{
	label: 'PARENT',
	kind: CompletionItemKind.Text,
	data: 45
};



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

		const returnArray: CompletionList = {isIncomplete: true, items:[]};
		if (keywords[keywords.length - 1] == "ADD CONSTRUCTOR") // ADD CONSTRUCTOR CONTEXT
			returnArray.items.push(...[	
				CREATE,
				GRID,
				BASE,
				LIST,
				GENERAL,
				OPTIONAL,
				LISTITEM,
				LISTDELIMITER,
				DISPLAYITEM,
				AS
			]);

		else if (keywords[keywords.length - 1] == "CREATE TAG") // CREATE TAG CONTEXT
			returnArray.items.push(...[	
				AS,
				CREATE,
				TAG
			]);

		else if (keywords[keywords.length - 1] == "CREATE LINK") // CREATE LINK CONTEXT
			returnArray.items.push(...[	
				AS,
				CREATE,
				ADD,
				LINK
			]);

		else // ANY OTHER CONTEXT
			returnArray.items.push(...[
				CONSTRUCTOR,
				CHARACTER,
				BASE,
				INT,
				ADD,
				CREATE,
				IMPORT,
				GENERAL,
				DECORATOR,
				DEFAULTITEM,
				PARALLELDECORATOR,
				GENERATOR,
				NONE,
				AS,
				GENERALSTRICT,
				REFERENCE,
				BREAKITEM,
				OPTIONAL,
				OPTIONALGROUP,
				INPUT,
				OUTPUT,
				BREAKPERSIST,
				STOPITEM,
				LISTDELIMITER,
				LISTITEM,
				CONTAINITEM,
				RULE,
				CONDITION,
				DISPLAY,
				REMOVE,
				INHERIT,		
				TAG,
				LINK,
				PYLINK,
				GRID,
				DISPLAYITEM,
				PROPERTY,
				LINKGROUP,
				PARSE,
				SKIP,
				BIND,
				PARENT
			]);
		return returnArray;
	};

	
}