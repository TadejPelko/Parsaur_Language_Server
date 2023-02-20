import { CompletionItem, CompletionItemKind, TextDocument, TextDocumentPositionParams, TextDocuments, VersionedTextDocumentIdentifier } from 'vscode-languageserver';
import * as vscode from 'vscode';

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
	}
];

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
	//const contextArray: string[] = []; 
	for (const regexp of regularExpressions){
		if (regexp.regex.test(documentPart)){
			//contextArray.push(regexp.name);
			return regexp.name;
			break;
		}
	}
	return "";
	//return contextArray;
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
		let documentUpToCurrentCharacter = "";
		const hoverLine = lines[line].substring(0,character);
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
		// return[{
		// 	label: "brackets: " + return_res,
		// 	kind: CompletionItemKind.Text,
		// 	data: keywords}];

		if (keywords[keywords.length - 1] == "ADD CONSTRUCTOR")
			return [			{
				label: 'CONSTRUCTOR',
				kind: CompletionItemKind.Text,
				data: 1
				}
			];
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
			}
		];
	};
}