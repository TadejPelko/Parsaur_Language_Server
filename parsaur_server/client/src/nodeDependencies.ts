import * as vscode from 'vscode';
import { environment } from './environments/environment';


/**
 * Contains funtions for hierarchical definitions search. 
 */
export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {

	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;
	private edgelist = environment['hierarchy_json'];
	private dependencyDictionary = {};


  /**
   * Constructor for Parsaur Definition Dependency Provider.
   *
   * @remarks
   * Upon construction, a dictionary mapping definitions to their full dependency path is created.
   *
   * @returns DepNodeProvider class instance
   */
	constructor() {
		this.constructDependencyDictionary();
	}


 /**
   * Constructs a dictionary mapping definitions to their full dependency path.
   * 
   * @returns Dictionary mapping definitions to their full dependency path
   */
	private constructDependencyDictionary(){
		const arr = this.edgelist.split('\t');
		for(const line of arr) {
			const splittedLine = line.split(' ');
			const term1 = splittedLine[0];
			if (!term1)
				continue;
			const term1_split = term1.split('.');
			const term2 = splittedLine[1];
			if (!term2)
				continue;
			const term2_split = term2.split('.');

			if (!(term1 in this.dependencyDictionary))
				this.dependencyDictionary[term1_split[term1_split.length - 1]] = term1;
				
			if (!(term2 in this.dependencyDictionary))
				this.dependencyDictionary[term2_split[term2_split.length - 1]] = term2;
		}
	}

	public refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	public getTreeItem(element: Dependency): vscode.TreeItem {
		return element;
	}

 /**
   * Checks whether the definition has a child in the hierarchy
   * 
   * @param item - Definition name
   * 
   * @returns Boolean answer
   */
	private checkForChildren(item: string): boolean {
		const arr = this.edgelist.split('\t');
		for(const line of arr) {
			const splittedLine = line.split(' ');
			if (splittedLine[0] === item){
				return true;
			}
		}
		return false;
	}

 /**
   * Finds children of a definition
   * 
   * @remarks
   * The functions reads {@link edgelist}
   * 
   * @param item - Definition name
   * 
   * @returns Promise of the list of the given definitions children as {@link Dependency} list.
   */
	private readItemFromEdgelistPromise(item: string): Thenable<Dependency[]>{
		const returnResult: Dependency[] = [];
		const arr = this.edgelist.split('\t');
		for(const line of arr) {
			const splittedLine = line.split(' ');
			if (splittedLine[0] === item){
				const splittedName = splittedLine[1].split('.');
				if (this.checkForChildren(splittedLine[1]))
					returnResult.push(new Dependency(splittedName[splittedName.length-1], splittedLine[1], "", vscode.TreeItemCollapsibleState.Collapsed, []));
				else
					returnResult.push(new Dependency(splittedName[splittedName.length-1], splittedLine[1], "", vscode.TreeItemCollapsibleState.None, []));
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
						new Dependency("GENERIC_LISTS", "GENERIC_LISTS", "", vscode.TreeItemCollapsibleState.Collapsed, []),
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
		if (inputTermUpperCase in this.dependencyDictionary){
			vscode.env.clipboard.writeText(this.dependencyDictionary[inputTermUpperCase]);
			vscode.window.showInformationMessage(`Copied ${this.dependencyDictionary[inputTermUpperCase]} to clipboard.`);
		}else{
			vscode.window.showInformationMessage(`Could not find ${input_term}.`);
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