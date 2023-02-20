import * as vscode from 'vscode';

 /**
   * Calculates the Hamming distance between two strings.
   * 
   * @param a - First string
   * @param b - Second string
   * @param maxDistance - maximum allowed distance between the two strings
   * 
   * @returns - Boolean answer to whether the distance between the two strings is at most {@link maxDistance}
   */
const stringDistance = (a: string, b: string, maxDistance: number): boolean => {
	const aL = a.length;
	const bL = b.length;
	let distance = 0;
	if (bL > aL){
		if (bL - aL > maxDistance)
			return false;
		for (var ix = 0; ix<bL; ix++){
			if(a[ix] != b[ix])
				distance++;
			if(distance > maxDistance)
				return false;
		}
		return distance + bL - aL <= maxDistance;
	}else{
		if (aL - bL > maxDistance)
			return false;
		for (var ix = 0; ix<aL; ix++){
			if(a[ix] != b[ix])
				distance++;
			if(distance > maxDistance)
				return false;
		}
		return distance + aL - bL <= maxDistance;
	}
};

 /**
   * Provides VSCode Quick fixes for the Parsaur language. 
   */
export class AutoFix implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

 /**
   * Extracts the word of the character. 
   * 
   * @param str - string in which the word we want to extract is found
   * @param position - position of the character within the string
   * 
   * @returns The word of the character 
   */
	private getWordAt(str:string, position): [string, number, number] {
		const isSpace = (c) => /\W/.exec(c);
		let start = position - 1;
		let end = position;
	  
		while (start >= 0 && !isSpace(str[start])) {
		  start -= 1;
		}
		start = Math.max(0, start + 1);
	  
		while (end < str.length && !isSpace(str[end])) {
		  end += 1;
		}
		end = Math.max(start, end);
		
		return [str.substring(start, end), start, end];
	}


 /**
   * Suggests code fix VSCode action. 
   * 
   * @param document - document content
   * @param range - vscode.Range of editing position within the document
   * 
   * @returns Array of suggested fixes 
   */
	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[] | undefined {
		const [fixes, start, stop] = this.extractFix(document, range);
		if (fixes.length == 0) {
			return;
		}
		const offsetLeft = start -range.start.character;
		const offsetRight =  stop - range.start.character;
		const suggestedFixesArray =[];
		for (const fix of fixes){
			suggestedFixesArray.push(this.createFix(document, range, fix, offsetLeft, offsetRight));
		}

		return suggestedFixesArray;
	}

 /**
   * Extracts possible fixes. 
   * 
   * @param document - document content
   * @param range - vscode.Range of editing position within the document
   * 
   * @returns Array of the following elements: [string array of suggested code fixes, beginning position of the fix, ending position of the fix] .
   */
	private extractFix(document: vscode.TextDocument, range: vscode.Range): [Array<string>, number, number] {
		const start = range.start;
		const line = document.lineAt(start.line);
		const [word, startIx, stopIx] = this.getWordAt(line.text, start.character);
		const autoFixes = this.suggestFix(word);
		return [autoFixes, startIx, stopIx];
	}

 /**
   * Suggests code fixes. 
   * 
   * @param word - document word to be fixed
   * 
   * @returns Array of suggested fixes 
   */
	private suggestFix(word: string): string[] {
		const arrayOfFixes = [];
		for(const potentialFix of this.listOfAutoFixes){
			if (word == potentialFix)
				continue;
			if (word.toUpperCase() == potentialFix){
				arrayOfFixes.push(potentialFix);
				continue;
			}
			if (stringDistance(word, potentialFix, word.length/3))
				arrayOfFixes.push(potentialFix);
		}
		return arrayOfFixes;
	}

 /**
   * Creates a code action quick fix. 
   * 
   * @param document - document content
   * @param range - vscode.Range of editing position within the document
   * @param stringFix - the suggested code fix string
   * @param offsetLeft - position of the beginning of the fix 
   * @param offsetRight - position of the ending of the fix
   * 
   * @returns Code action quick fix.
   */
	private createFix(document: vscode.TextDocument, range: vscode.Range, stringFix: string, offsetLeft: number, offsetRight: number): vscode.CodeAction {
		const fix = new vscode.CodeAction(`Convert to ${stringFix}`, vscode.CodeActionKind.QuickFix);
		fix.edit = new vscode.WorkspaceEdit();
		fix.edit.replace(document.uri, new vscode.Range(range.start.translate(0, offsetLeft), range.start.translate(0, offsetRight)), stringFix);
		return fix;
	}

 /**
   * Array of possible code fixes.  
   */
	private listOfAutoFixes = [
		"CONSTRUCTOR",
		"CHARACTER",
		"BASE",
		"INT",
		"ADD",
		"CREATE",
		"IMPORT",
		"General",
		"Decorator",
		"DefaultItem",
		"CastItem",
		"ParallelDecorator",
		"Generator",
		"LIST",
		"None",
		"GeneralStrict",
		"Reference",
		"BreakItem",
		"DecoratorItem",
		"Optional",
		"OptionalGroup",
		"Input",
		"Output",
		"BreakPersist",
		"StopItem",
		"ListDelimiter",
		"ListItem",
		"ContainItem",
		"Rule",
		"Condition",
		"Display",
		"Remove",
		"Inherit",
		"AS",
		"TAG",
		"LINK",
		"PYLINK",
		"GRID",
		"DisplayItem",
		"PROPERTY"
	];
}