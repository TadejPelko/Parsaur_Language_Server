import { CompletionItem, CompletionItemKind, TextDocument, TextDocumentPositionParams, TextDocuments, VersionedTextDocumentIdentifier } from 'vscode-languageserver';

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
		];
	}
}