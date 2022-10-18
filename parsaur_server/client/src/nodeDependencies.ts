import * as vscode from 'vscode';
import { environment } from './environments/environment';

export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {

	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;
	private edgelist = environment['hierarchy_json'];
	private dependencyDictionary = {};

	constructor() {
		this.constructDependencyDictionary();
	}

	private constructDependencyDictionary(){
		const arr = this.edgelist.split('\t');
		for(let line of arr) {
			let splittedLine = line.split(' ');
			let term1 = splittedLine[0];
			if (!term1)
				continue
			let term1_split = term1.split('.');
			let term2 = splittedLine[1];
			if (!term2)
				continue
			let term2_split = term2.split('.');

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

	private checkForChildren(item: string): boolean {
		const arr = this.edgelist.split('\t');
		for(let line of arr) {
			let splittedLine = line.split(' ');
			if (splittedLine[0] === item){
				return true;
			}
		}
		return false;
	}

	private readItemFromEdgelistPromise(item: string): Thenable<Dependency[]>{
		let returnResult: Dependency[] = [];
		const arr = this.edgelist.split('\t');
		for(let line of arr) {
			let splittedLine = line.split(' ');
			if (splittedLine[0] === item){
				let splittedName = splittedLine[1].split('.')
				if (this.checkForChildren(splittedLine[1]))
					returnResult.push(new Dependency(splittedName[splittedName.length-1], splittedLine[1], "", vscode.TreeItemCollapsibleState.Collapsed, []));
				else
					returnResult.push(new Dependency(splittedName[splittedName.length-1], splittedLine[1], "", vscode.TreeItemCollapsibleState.None, []));
			}
		}
		return Promise.resolve(returnResult);
	}

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

	public async provideNodeSearch(){
		let searchInput = vscode.window.showInputBox();
		if (!searchInput)
			return;

		let input_term = await searchInput;
		let inputTermUpperCase = input_term.toUpperCase();
		if (inputTermUpperCase in this.dependencyDictionary){
			//await vscode.commands.executeCommand('workbench.actions.treeView.nodeDependencies.collapseAll');
			vscode.env.clipboard.writeText(this.dependencyDictionary[inputTermUpperCase]);
			vscode.window.showInformationMessage(`Copied ${this.dependencyDictionary[inputTermUpperCase]} to clipboard.`);
		}else{
			vscode.window.showInformationMessage(`Could not find ${input_term}.`);
		}
	}
}

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