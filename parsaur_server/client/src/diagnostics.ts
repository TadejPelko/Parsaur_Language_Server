import * as vscode from 'vscode';
import * as fs from 'fs';
import { DefinitionEntry } from './definitionsParsing';

export class DiagnosticsProvider {

	private SINGLE_LINE_COMMENT_CHARACTER = "//";
	private MULTI_LINE_COMMENT_CHARACTER_OPEN = "/*";
	private MULTI_LINE_COMMENT_CHARACTER_CLOSE = "*/";

	private referencesDictionary = {};

	constructor() {}

	/**
	 * Extracts the term at given location and returns references of the extracted term.
	*/
	public getReferences(document: vscode.TextDocument, position : vscode.Position, dependencyDictionary : {[key: string]: DefinitionEntry}){
		const term = this.getSequenceAt(document.lineAt(position.line).text, position.character);
		if (term.indexOf(".") > -1)
			return this.referencesDictionary[term];
		else { // We need to find the context of the definition
			for (const entry in dependencyDictionary){
				if (dependencyDictionary[entry].name == term && document.uri.path == dependencyDictionary[entry].fileName && position.line == dependencyDictionary[entry].line) // The name being the same is not good enough for a matching because there is no context so we add the location of the definition conditions
					return this.referencesDictionary[dependencyDictionary[entry].fullName]
			}
		}
	}

	/**
	 * Checks for falsely written definitions in all files. Diagnostics are reported as "problems" to the user. 
	 * It also finds references to all defined terms. 
	 * 
	 * @param dependencyDictionary - dictionary of defined terms (definitions)
	 * @param collection - collection of diagnostics shown to the user
	*/
	public async refreshDiagnostics(dependencyDictionary, collection: vscode.DiagnosticCollection) {
		console.log("Beginning diagnostics");
		collection.clear();
		this.referencesDictionary = {};
		const uris = await vscode.workspace.findFiles('**/{*.mql}');
		for (const uri of uris){
			const split = uri.path.split('/');
			split.shift(); // remove the unnecessary "c:"
			await fs.promises.readFile(split.join("/")).then((res) => { 	//	This might be changed to parallel
				const doc = res.toString();
				if (doc){
					const diagnostics: vscode.Diagnostic[] = [];
					const documentLines = doc?.split('\n');
					let ignoreLineDueToComment = false;
					for (let lineIx = 0; lineIx < documentLines.length; lineIx++){
						let currentLine = documentLines[lineIx];
						// Check for comment characters
						if (ignoreLineDueToComment){
							const multi_line_comment_close_char_ix = currentLine.indexOf(this.MULTI_LINE_COMMENT_CHARACTER_CLOSE);
							if (multi_line_comment_close_char_ix > -1){ //line contains the end of multi-line comment
								currentLine = currentLine.substring(multi_line_comment_close_char_ix, currentLine.length);
								ignoreLineDueToComment = false;
							}else
								continue; // line is commented
						}
						const multi_line_comment_open_char_ix = currentLine.indexOf(this.MULTI_LINE_COMMENT_CHARACTER_OPEN);
						if (multi_line_comment_open_char_ix > -1){
							currentLine = currentLine.substring(0, multi_line_comment_open_char_ix);
							ignoreLineDueToComment = true;
						}
						const single_line_comment_char_ix = currentLine.indexOf(this.SINGLE_LINE_COMMENT_CHARACTER);
						if (single_line_comment_char_ix > -1){
							currentLine = currentLine.substring(0, single_line_comment_char_ix);
						}
						const ix = currentLine.indexOf("?"); //Hierarchy terms always start with '?'
						if (ix > -1){
							const term = this.getSequenceAt(currentLine, ix + 1);
							let found = false;
							for (const entry in dependencyDictionary){
								if (dependencyDictionary[entry]["fullName"] == term){
									found = true;
									break;
								}
							}
							if (!found){
								const range = new vscode.Range(lineIx, ix, lineIx, ix + term.length);
								diagnostics.push(
									new vscode.Diagnostic(range, "Term: " + term + " is invalid!", vscode.DiagnosticSeverity.Error)
								);
							} else {
								if (term in this.referencesDictionary)
									this.referencesDictionary[term].push(new vscode.Location(uri, new vscode.Position(lineIx, ix)));
								else
									this.referencesDictionary[term] = [new vscode.Location(uri, new vscode.Position(lineIx, ix))];
							}
						}
					}
					collection.set(uri,diagnostics);
				}
			});
		}
		console.log("Finishing diagnostics");
	}

	/**
	 * Extracts the word of the character but allowing "." (for full path definitions).  
	 * 
	 * @param str - string in which the word we want to extract is found
	 * @param position - position of the character within the string
	 * 
	 * @returns The word of the character 
	*/
	private getSequenceAt(str: string, pos: number): string {
		// Perform type conversions.
		str = String(str);
		pos = Number(pos) >>> 0;

		// Search for the word's beginning and end.
		const left = str.slice(0, pos + 1).search(/(\w|\.)+$/),
			right = str.slice(pos).search(/( |\(|\)|\t|\,|\;|\n|\r|\r\n)+/);

		// The last word in the string is a special case.
		if (right < 0) {
			return str.slice(left);
		}

		// Return the word, using the located bounds to extract it from the string.
		return str.slice(left, right + pos);
	}
}
