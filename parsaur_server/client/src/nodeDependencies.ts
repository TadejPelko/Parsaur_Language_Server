import * as vscode from 'vscode';

/**
 * Contains funtions for hierarchical definitions search. 
 */
export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {

	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;
	private dependencyDictionary = {};


  /**
   * Constructor for Parsaur Definition Dependency Provider.
   *
   * @remarks
   * Upon construction, a dictionary mapping definitions to their full dependency path is created.
   *
   * @returns DepNodeProvider class instance
   */
	constructor(parsedDefinitions) {
		this.dependencyDictionary = parsedDefinitions;
	}

	public refreshDictionary(dictionary){
		this.dependencyDictionary = dictionary;
	}

	public refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	public getTreeItem(element: Dependency): vscode.TreeItem {
		return element;
	}

 /**
   * Finds children of a definition
   * 
   * @param item - Definition name
   * 
   * @returns Promise of the list of the given definitions children as {@link Dependency} list.
   */
	private readItemFromEdgelistPromise(item: string): Thenable<Dependency[]>{
		const returnResult: Dependency[] = [];
		for (const entry in this.dependencyDictionary){
			if (this.dependencyDictionary[entry]["fullName"] == item){
				for(const child of this.dependencyDictionary[entry]["childrenKeys"]){
					if (this.dependencyDictionary[child]["children"].length > 0)
						returnResult.push(new Dependency(this.dependencyDictionary[child]["name"], this.dependencyDictionary[child]["fullName"], "", vscode.TreeItemCollapsibleState.Collapsed, []));
					else
						returnResult.push(new Dependency(this.dependencyDictionary[child]["name"], this.dependencyDictionary[child]["fullName"], "", vscode.TreeItemCollapsibleState.None, []));
				}
			}
		}
		return Promise.resolve(returnResult);
	}

 /**
   * Finds children of a definition
   * 
   * @remarks
   * If the parameter is not given then it returns the two "top level" definitions.
   * 
   * @param item - Definition {@link Dependency}
   * 
   * @returns Promise of the list of the given definitions children as {@link Dependency} list.
   */
	public getChildren(element?: Dependency): Thenable<Dependency[]> {
		if (element){
			return this.readItemFromEdgelistPromise(element.full_name);
		}else{
			return Promise.resolve([
						//new Dependency("GENERIC_LISTS", "GENERIC_LISTS", "", vscode.TreeItemCollapsibleState.Collapsed, []),
						new Dependency("FILE_ELEMENT", "FILE_ELEMENT", "", vscode.TreeItemCollapsibleState.Collapsed, []),
					]);
		}
	}

 /**
   * Provides an input box for the user. Maps the inputed definition name to its full path and writes it to clipboard.
   */
	public async provideNodeSearch(){
		const searchInput = vscode.window.showInputBox();
		if (!searchInput)
			return;

		const input_term = await searchInput;
		const inputTermUpperCase = input_term.toUpperCase();
		for (const entry in this.dependencyDictionary){
			if (inputTermUpperCase == this.dependencyDictionary[entry]["name"]){
				vscode.env.clipboard.writeText(this.dependencyDictionary[entry]["fullName"]);
				vscode.window.showInformationMessage(`Copied ${this.dependencyDictionary[entry]["fullName"]} to clipboard.`);
				return;
			}
		}
		// Round 2 of search
		for (const entry in this.dependencyDictionary){
			if (this.dependencyDictionary[entry]["fullName"].indexOf(inputTermUpperCase) > -1){
				vscode.env.clipboard.writeText(this.dependencyDictionary[entry]["fullName"]);
				vscode.window.showInformationMessage(`Copied ${this.dependencyDictionary[entry]["fullName"]} to clipboard.`);
				return;
			}
		}
		vscode.window.showInformationMessage(`Could not find ${input_term}.`);
	}
}

export function openDefinition(suggestionsDictionary, searchDependency: Dependency){
	for(const entry in suggestionsDictionary){
		if(suggestionsDictionary[entry]["fullName"] == searchDependency.full_name){
			vscode.workspace.openTextDocument(suggestionsDictionary[entry]["fileName"]).then(doc => 
				{
					vscode.window.showTextDocument(doc).then(editor => 
					{
						const pos = new vscode.Position(suggestionsDictionary[entry]["line"], suggestionsDictionary[entry]["character"]);
						// Line added - by having a selection at the same position twice, the cursor jumps there
						editor.selections = [new vscode.Selection(pos,pos)]; 
				
						// And the visible range jumps there too
						const range = new vscode.Range(pos, pos);
						editor.revealRange(range);
					});
				});
		}
	}
}

 /**
   * Provides a class that holds a dependency.
   * 
   * @remarks
   * Used for the tree structure in the Structure explorer menu
   */
export class Dependency extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly full_name: string,
		private readonly type: string,
		public collapsibleState: vscode.TreeItemCollapsibleState,
		public children: Dependency[]
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.full_name}`;
	}

	contextValue = 'dependency';
}