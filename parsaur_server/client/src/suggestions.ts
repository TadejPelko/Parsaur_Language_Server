import { DefinitionEntry } from "./definitionsParsing";
import * as vscode from 'vscode';

export class SuggestionsProvider{
	private dependencyDictionary: {[key: string]: DefinitionEntry} = {};

    constructor(parsedDefinitions) {
		this.dependencyDictionary = parsedDefinitions;
	}

    public refreshDictionary(dictionary){
		this.dependencyDictionary = dictionary;
	}
    
    private arraysEqual(a:any[], b:any[]) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;
    
        for (let i = 0; i < a.length; ++i) {
          if (a[i] !== b[i]) return false;
        }
        return true;
    }
    
    /**
       * Provides relevant code completions.
       * 
       * @param line - Relevant line in document
       * @param word - The word for which we want InteliSense
       * 
       * @returns code suggestion {@link CompletionList}
    */
    private getInteliSenseSuggestions(document: vscode.TextDocument, word) {
        let dotHierarchy: any[] = [];
        dotHierarchy = word.split(".");
        dotHierarchy.pop();
        if (dotHierarchy.length < 1){ //top level definitions
            let returnArray = [];
            for (const keyName in this.dependencyDictionary){
                if (this.dependencyDictionary[keyName].context == "" && this.dependencyDictionary[keyName].name != "FILE_ELEMENT") // we already add file_element in another place
                    returnArray.push(this.dependencyDictionary[keyName].name);
            }
            return returnArray;
        }
        for (const keyName in this.dependencyDictionary){
            if (this.arraysEqual(dotHierarchy, this.dependencyDictionary[keyName].fullName.split('.')))
                return this.dependencyDictionary[keyName].children;
            const contextCopy = this.dependencyDictionary[keyName].fullName.split('.');
            contextCopy[0] = "?"+contextCopy[0];
            if (this.arraysEqual(dotHierarchy, contextCopy)) // if we use inheritance
                return this.dependencyDictionary[keyName].children;
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
    public getCodeCompletions(document: vscode.TextDocument, position: vscode.Position){
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
        let bracketSplit = word.split('(');
        word = bracketSplit[bracketSplit.length - 1];
        word = word.trim();
        const inteliSenseSuggestions = this.getInteliSenseSuggestions(document, word);
        return inteliSenseSuggestions;
    }
}