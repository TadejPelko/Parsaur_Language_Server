import { DefinitionEntry } from "./definitionsParsing";
import * as vscode from 'vscode';
import { getSequenceAt } from "./sequenceParsing";

export class LocationProvider{
    private dependencyDictionary: {[key: string]: DefinitionEntry} = {};

    constructor(parsedDefinitions) {
		this.dependencyDictionary = parsedDefinitions;
	}

    public refreshDictionary(dictionary){
		this.dependencyDictionary = dictionary;
	}

    /**
         * Provide the definition of the term at the given position and document.
         *
         * @param document The document in which the command was invoked.
         * @param position The position at which the command was invoked.
         * @param token A cancellation token.
         * @return A definition or a thenable that resolves to such. The lack of a result can be
         * signaled by returning `undefined` or `null`.
    */
    public getLocation(document, position, token){
        const hoverLine = document.lineAt(position.line).text;
        const sequence = getSequenceAt(hoverLine, position.character); // word for definition search
        for (const keyName in this.dependencyDictionary){
            if (this.dependencyDictionary[keyName].fullName == sequence){
                const position = new vscode.Position(this.dependencyDictionary[keyName].line, this.dependencyDictionary[keyName].character);
                const file = vscode.Uri.file(this.dependencyDictionary[keyName].fileName);
                return new vscode.Location(file, position);
            }
        }
    }
}
