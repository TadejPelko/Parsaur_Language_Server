/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext, window } from 'vscode';
import { Dependency, DepNodeProvider, openDefinition } from './nodeDependencies';
import { AutoFix } from './AutoFix';
import { refreshDiagnostics } from './diagnostics';
//import { subscribeToDocumentChanges } from './diagnostics';
import { DefinitionEntry, getDefinitions } from './definitionsParsing';
import * as vscode from 'vscode';


import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;
let suggestionsDictionary: {[key: string]: DefinitionEntry} = {};
const nodeDependenciesProvider = new DepNodeProvider({});


export function activate(context: ExtensionContext) {
	window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependenciesProvider.provideNodeSearch());

	const termDiagnostic = vscode.languages.createDiagnosticCollection('test');
	context.subscriptions.push(termDiagnostic);
	vscode.commands.registerCommand('nodeDependencies.copyEntry', (node: Dependency) => {
		vscode.env.clipboard.writeText(node.fullName);
		vscode.window.showInformationMessage(`Copied ${node.fullName} to clipboard.`);
	});

	vscode.commands.registerCommand('nodeDependencies.openDefinition', (node: Dependency) => {
		openDefinition(suggestionsDictionary, node);
	});

	getDefinitions().then((res) => {
		setNewDefinitions(res);
		refreshDiagnostics(res, termDiagnostic);
	});
	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		console.log("SAVED DOC", document);
		getDefinitions().then((res) => {
			setNewDefinitions(res);
			refreshDiagnostics(res, termDiagnostic);
		});
	});
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('prs', new AutoFix(), {
			providedCodeActionKinds: AutoFix.providedCodeActionKinds
		})
	);
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
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
	));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
		'prs',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				return [new vscode.CompletionItem("FILE_ELEMENT", vscode.CompletionItemKind.Method)];
			}
		},
		'?' // triggered whenever a '?' is being typed
	));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider(
		'prs',
		{
			provideDefinition(document, position, token) {
				const hoverLine = document.lineAt(position.line).text;
				const sequence = getSequenceAt(hoverLine, position.character); // word for definition search
				for (const keyName in suggestionsDictionary){
					if (suggestionsDictionary[keyName].fullName == sequence){
						const position = new vscode.Position(suggestionsDictionary[keyName].line, suggestionsDictionary[keyName].character);
						const file = vscode.Uri.file(suggestionsDictionary[keyName].fileName);
						return new vscode.Location(file, position);
					}
				}
			},
		}
	));

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

function setNewDefinitions(parsed){
	suggestionsDictionary = parsed;
	nodeDependenciesProvider.refreshDictionary(parsed)
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
   * @param line - Relevant line in document
   * @param word - The word for which we want InteliSense
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
		if (arraysEqual(dotHierarchy, suggestionsDictionary[keyName].fullName.split('.')))
			return suggestionsDictionary[keyName].children;
		const contextCopy = suggestionsDictionary[keyName].fullName.split('.');
		contextCopy[0] = "?"+contextCopy[0];
		if (arraysEqual(dotHierarchy, contextCopy)) // if we use inheritance
			return suggestionsDictionary[keyName].children;
	}
}

/**
   * Suggests relevant code completions.
   * 
   * @param document - Open documents in workspace
   * @param position - Position of the character for which we are looking the code completion
   * 
   * @returns The completion handler
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
	let word = wordSplit[wordSplit.length - 1];
	if(word.startsWith('('))
		word = word.slice(1);
	word = word.trim();
	const inteliSenseSuggestions = getInteliSenseSuggestions(document, word);
	return inteliSenseSuggestions;
}

/**
   * Extracts the word of the character. 
   * 
   * @param str - String in which the word we want to extract is found
   * @param pos - Position of the character within the string, of which we want to extract the sequence
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

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

