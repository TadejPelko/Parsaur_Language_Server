/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext, window } from 'vscode';
import { Dependency, DepNodeProvider } from './nodeDependencies';
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
import { SuggestionsProvider } from './suggestions';
import { LocationProvider } from './goToDefinition';

let client: LanguageClient;
let suggestionsDictionary: {[key: string]: DefinitionEntry} = {};
const nodeDependenciesProvider = new DepNodeProvider({});
const suggestionsProvider = new SuggestionsProvider({});
const locationProvider = new LocationProvider({});

export function activate(context: ExtensionContext) {
	window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	vscode.commands.registerCommand('nodeDependencies.searchEntry', () => nodeDependenciesProvider.provideNodeSearch());

	const termDiagnostic = vscode.languages.createDiagnosticCollection('test');
	context.subscriptions.push(termDiagnostic);
	vscode.commands.registerCommand('nodeDependencies.copyEntry', (node: Dependency) => {
		vscode.env.clipboard.writeText(node.fullName);
		vscode.window.showInformationMessage(`Copied ${node.fullName} to clipboard.`);
	});

	vscode.commands.registerCommand('nodeDependencies.openDefinition', (node: Dependency) => {
		nodeDependenciesProvider.openDefinition(node);
	});

	getDefinitions().then((res) => {
		setNewDefinitions(res);
		refreshDiagnostics(res, termDiagnostic);
	});
	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		console.log("Saved document!", document);
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
				const val = suggestionsProvider.getCodeCompletions(document, position);
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
	context.subscriptions.push(vscode.languages.registerDefinitionProvider( // Go to definition feature
		'prs',
		{
			provideDefinition(document, position, token) {
				return locationProvider.getLocation(document, position, token);
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
	suggestionsProvider.refreshDictionary(parsed);
	nodeDependenciesProvider.refreshDictionary(parsed);
	locationProvider.refreshDictionary(parsed);
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

