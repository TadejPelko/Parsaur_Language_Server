import * as vscode from 'vscode';

const stringDistance = (a: string, b: string, maxDistance: number): boolean => {
	const aL = a.length;
	const bL = b.length;
	let distance = 0;
	if (bL > aL){
		if (bL - aL > maxDistance)
			return false
		for (var ix = 0; ix<bL; ix++){
			if(a[ix] != b[ix])
				distance++;
			if(distance > maxDistance)
				return false;
		}
		return distance + bL - aL <= maxDistance;
	}else{
		if (aL - bL > maxDistance)
			return false
		for (var ix = 0; ix<aL; ix++){
			if(a[ix] != b[ix])
				distance++;
			if(distance > maxDistance)
				return false;
		}
		return distance + aL - bL <= maxDistance;
	}
}

export class AutoFix implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

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

	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[] | undefined {
		let [fixes, start, stop] = this.extractFix(document, range);
		if (fixes.length == 0) {
			return;
		}
		let offsetLeft = start -range.start.character;
		let offsetRight =  stop - range.start.character;
		let suggestedFixesArray =[];
		for (var fix of fixes){
			suggestedFixesArray.push(this.createFix(document, range, fix, offsetLeft, offsetRight));
		}

		return suggestedFixesArray;
	}

	private extractFix(document: vscode.TextDocument, range: vscode.Range): [Array<string>, number, number] {
		const start = range.start;
		const line = document.lineAt(start.line);
		let [word, startIx, stopIx] = this.getWordAt(line.text, start.character);
		let autoFixes = this.suggestFix(word);
		return [autoFixes, startIx, stopIx];
	}

	private suggestFix(word: string): string[] {
		let arrayOfFixes = [];
		for(var potentialFix of this.listOfAutoFixes){
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

	private createFix(document: vscode.TextDocument, range: vscode.Range, stringFix: string, offsetLeft: number, offsetRight: number): vscode.CodeAction {
		const fix = new vscode.CodeAction(`Convert to ${stringFix}`, vscode.CodeActionKind.QuickFix);
		fix.edit = new vscode.WorkspaceEdit();
		fix.edit.replace(document.uri, new vscode.Range(range.start.translate(0, offsetLeft), range.start.translate(0, offsetRight)), stringFix);
		return fix;
	}

	
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
		"AS"
	];
}