import { CompletionItem, CompletionItemKind, TextDocumentPositionParams } from 'vscode-languageserver';

export function getCompletionHandler(){
	return (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
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
	
		];
	}
}