/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext, window } from 'vscode';
import { Dependency, DepNodeProvider } from './nodeDependencies';
import { AutoFix } from './AutoFix';
import { subscribeToDocumentChanges } from './diagnostics';
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

const suggestionsDictionary = {};


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
				return val;
			}
		},
		'.' // triggered whenever a '.' is being typed
	);

	context.subscriptions.push(provider2);
	

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
	if (dotHierarchy.join(".") in suggestionsDictionary){
		return suggestionsDictionary[dotHierarchy.join(".")];
	}
	const returnArray = [];
	const possibleConstructors = [];
	const workspaceFolder: vscode.WorkspaceFolder | undefined = vscode.workspace.getWorkspaceFolder(document.uri);
	const glob = workspaceFolder.name + '/*';
	for (const constructor of regularExpressionsContext)
		possibleConstructors.push(constructor['name']);
	
	for (const constructor of possibleConstructors){
		const searchTerm = constructor;
		vscode.workspace.findFiles('**/{*.mql}', null, 1000).then((uris: vscode.Uri[] ) => {      
			uris.forEach((uri: vscode.Uri) => {              
				const split = uri.path.split('/');
				split.shift(); // remove the unnecessary "c:"
				fs.readFile(split.join("/"), (err, data) => {
					if (err) throw err;
					const doc = data.toString();
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
									returnArray.push(
										new vscode.CompletionItem(extracted, vscode.CompletionItemKind.Method)
									);
									console.log("ADDING", dotHierarchy.join("."), extracted );
									if (dotHierarchy.join(".") in suggestionsDictionary){
										if (!(containsObject(extracted, suggestionsDictionary[dotHierarchy.join(".")])))
											suggestionsDictionary[dotHierarchy.join(".")].push(new vscode.CompletionItem(extracted, vscode.CompletionItemKind.Method));
									}
									else{
										suggestionsDictionary[dotHierarchy.join(".")] = [new vscode.CompletionItem(extracted, vscode.CompletionItemKind.Method)];
									}
								}
							}
						}
					}
				});
			});
		}); 
	}
	return returnArray;
}

function containsObject(obj, list) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].label === obj) {
            return true;
        }
    }
    return false;
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
