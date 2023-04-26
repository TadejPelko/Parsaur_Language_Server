/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext, window } from 'vscode';
import { Dependency, DepNodeProvider } from './nodeDependencies';
import { AutoFix } from './AutoFix';
import { subscribeToDocumentChanges } from './diagnostics';
import { getDefinitions, parseDefinitions, postProcessingDefinitions } from './definitionsParsing';
import * as vscode from 'vscode';
import * as fs from 'fs';


import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
	DocumentSelector,
	FileSystemWatcher
} from 'vscode-languageclient/node';

let client: LanguageClient;

let suggestionsDictionary = {};


export function activate(context: ExtensionContext) {
	const nodeDependenciesProvider = new DepNodeProvider();
	window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	vscode.commands.registerCommand('nodeDependencies.copyEntry', (node: Dependency) => {
		vscode.env.clipboard.writeText(node.full_name);
		vscode.window.showInformationMessage(`Copied ${node.full_name} to clipboard.`);
	});
	vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependenciesProvider.provideNodeSearch());

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('prs', new AutoFix(), {
			providedCodeActionKinds: AutoFix.providedCodeActionKinds
		})
	);

	const provider2 = vscode.languages.registerCompletionItemProvider(
		'prs',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const val = getCodeCompletions(document, position);
				const suggestionsArray = [];
				for (const suggestion of val){
					suggestionsArray.push(new vscode.CompletionItem(suggestion, vscode.CompletionItemKind.Method));
				}
				return suggestionsArray;
			}
		},
		'.' // triggered whenever a '.' is being typed
	);

	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		console.log("SAVED DOC", document);
	});

	context.subscriptions.push(provider2);
	getDefinitions().then((res) => suggestionsDictionary = res);

	// const emojiDiagnostics = vscode.languages.createDiagnosticCollection("emoji");
	// subscribeToDocumentChanges(context, emojiDiagnostics);
	
	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'prs' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'ParsaurLanguageServer',
		'Parsaur Language Server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
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
   * @param line - relevant line in document
   * 
   * @returns code suggestion {@link CompletionList}
*/
function getInteliSenseSuggestions(document: vscode.TextDocument, word) {
	let dotHierarchy: any[] = [];
	dotHierarchy = word.split(".");
	dotHierarchy.pop();
	if (dotHierarchy.length < 1)
		return;
	for (const keyName in suggestionsDictionary){
		if (arraysEqual(dotHierarchy, suggestionsDictionary[keyName]['fullName'].split('.')))
			return suggestionsDictionary[keyName]['children'];
		const contextCopy = suggestionsDictionary[keyName]['fullName'].split('.');
		contextCopy[0] = "?"+contextCopy[0];
		if (arraysEqual(dotHierarchy, contextCopy)) // if we use inheritance
			return suggestionsDictionary[keyName]['children'];
	}
}

/**
   * Suggests relevant code completions.
   * 
   * @param document - open documents in workspace
   * 
   * @returns the completion handler
*/
export function getCodeCompletions(document: vscode.TextDocument, position: vscode.Position){
	// The pass parameter contains the position of the text document in
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.
	const line = position.line;
	const character = position.character;
	const doc = document;
	const text = doc.getText();
	const lines = text.split('\n');
	const hoverLine = lines[line].substring(0,character);
	const wordSplit = hoverLine.split(" ");
	const word = wordSplit[wordSplit.length - 1];
	const inteliSenseSuggestions = getInteliSenseSuggestions(document, word);
	return inteliSenseSuggestions;
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
