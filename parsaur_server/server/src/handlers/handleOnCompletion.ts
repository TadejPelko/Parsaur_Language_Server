import { CompletionItem, CompletionItemKind, TextDocument, TextDocumentPositionParams, TextDocuments, VersionedTextDocumentIdentifier } from 'vscode-languageserver';

// const regularExpressions = [
// 	{
// 		regex: new RegExp('*(CREATE\s+TAG)*'),
// 		name: "CREATE TAG"
// 	}
// ];

const openBrackets = ['(', '{'];
const closedBrackets = [')', '}']

function getOpenBrackets(documentString: string): boolean[]{
	var bracketArray = [];
	var stack = [];
	var bracketIx = 0;
	for (var char of documentString){
		if (char in openBrackets){
			bracketArray.push(true);
			stack.push({
				bracket: char,
				index: bracketIx
			});
		}
		if (char in closedBrackets){
			bracketArray.push(false);
			if (stack[stack.length - 1]['bracket'] === openBrackets[closedBrackets.indexOf(stack[stack.length - 1]['bracket'])]){
				bracketArray[stack[stack.length - 1]['index']] = false;
				stack.pop();
			}
		}
		bracketIx++;
	}

	return bracketArray;
}

// function findRegularExpressions(document: string[]): string[]{
// 	let contextArray = []; 
// 	for (var regexp of regularExpressions){

// 	}
// }

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
		var documentUpToCurrentCharacter = "";
		const hoverLine = lines[line].substring(0,character);
		for (var i = 0; i<line; i++){
			documentUpToCurrentCharacter += lines[i];
		}
		documentUpToCurrentCharacter += hoverLine;
		const openBracketArray = getOpenBrackets(documentUpToCurrentCharacter);
		const bracketSplitDocument = documentUpToCurrentCharacter.split(/\(|\)|\{|\}/);
		console.log(openBracketArray);
		debugger;
		var return_res = "";
		for (var i = 0; i<openBracketArray.length; i++){
			if (openBracketArray[i])
				return_res+=bracketSplitDocument[i];
		}
		// return[{
		// 	label: return_res,
		// 	kind: CompletionItemKind.Text,
		// 	data: "hahaha"}]


		return [
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
			}
		];
	}
}