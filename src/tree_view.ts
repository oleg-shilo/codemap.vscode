import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Uri, commands } from "vscode";
// import { Utils } from './utils';

export interface MapInfo {
	sourceFile: string;
	items: string[];
};

declare global {
	interface String {
		trimStart(): string;
		trimEnd(): string;
	}
}

String.prototype.trimStart = function () {
	if (this.length == 0)
		return this;
	let c = ' ';
	var i = 0;
	for (; this.charAt(i) == c && i < this.length; i++);
	return this.substring(i);
}

String.prototype.trimEnd = function () {
	return this.replace(/ +$/, "");
}


export class FavoritesTreeProvider implements vscode.TreeDataProvider<MapItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<MapItem | undefined> = new vscode.EventEmitter<MapItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<MapItem | undefined> = this._onDidChangeTreeData.event;

	constructor(private aggregateItems: () => MapInfo) {
		vscode.window.onDidChangeActiveTextEditor(editor => {
			this._onDidChangeTreeData.fire();
		});
		vscode.workspace.onDidChangeTextDocument(e => {
			this._onDidChangeTreeData.fire();
		})
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: MapItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: MapItem): Thenable<MapItem[]> {
		return new Promise(resolve => {
			if (element) {
				let items = element.children;
				items.forEach(x => x.updateState());
				resolve(items);
				// resolve([]);
			} else {
				let items = this.getScriptItems()
				items.forEach(x => x.updateState());
				resolve(items);
			}
		});
	}

	private getScriptItems(): MapItem[] {

		let nodes = [];

		// let refsNode = new MapItem('References', vscode.TreeItemCollapsibleState.Collapsed, 0, null, 'assembly_group');
		// nodes.push(refsNode);

		let info = this.aggregateItems();

		if (info == null || info.items.length == 0)
			return nodes;

		let items = info.items;

		let prev_node: MapItem = null;

		// https://github.com/Microsoft/vscode/issues/34130: TreeDataProvider: allow selecting a TreeItem without affecting its collapsibleState
		// https://github.com/patrys/vscode-code-outline/issues/24: Is it possible to disable expand/collapse on click
		// Until above items are fixed need to go with the plain text.
		let plainTextMode = true;

		items.forEach(item => {
			if (item != '') {
				let source_file = info.sourceFile;
				let tokens = item.split(':');
				let lineNumber = 0;

				let title: string = item;

				let nesting_level = item.length - item.trimStart().length;

				if (tokens.length > 1) {
					try {
						let positionStr = tokens.slice(-1)[0];
						lineNumber = Number(positionStr) - 1;
						title = item.slice(0, -(positionStr.length + 1)).replace(/ +$/, "");

					} catch (error) {
					}
				}
				else
					source_file = null;

				// the normal space s are collapsed by the tree item renderer 
				let non_whitespace_empty_char = ' ';

				let node = new MapItem(
					title,
					vscode.TreeItemCollapsibleState.Expanded,
					nesting_level,
					{
						command: 'codemap.navigate_to',
						title: '',
						// tooltip: file,
						arguments: [source_file, lineNumber],
					},
					source_file + '|' + lineNumber
				);

				if (plainTextMode) {
					node.collapsibleState = vscode.TreeItemCollapsibleState.None;
					node.label = non_whitespace_empty_char.repeat(nesting_level) + title;
					nodes.push(node);
				}
				else {
					if (prev_node) {
						if (nesting_level == 0) {
							nodes.push(node);
						}
						else if (prev_node.nesting_level == nesting_level) {
							if (prev_node.parent) {
								prev_node.parent.children.push(node);
								node.parent = prev_node;
							}
							else {
								nodes.push(node);
							}
						}
						else if (prev_node.nesting_level < nesting_level) {
							prev_node.children.push(node);
							node.parent = prev_node;
						}
						else if (prev_node.nesting_level > nesting_level) {
							let dif = prev_node.nesting_level - nesting_level;
							for (let i = 0; i < dif; i++) {
								prev_node = prev_node.parent
							}
							prev_node.children.push(node);
							node.parent = prev_node;
						}
					}
					else {
						nodes.push(node);

					}
					prev_node = node;
				}
			}
		});

		return nodes;
	}
}

export class MapItem extends vscode.TreeItem {

	constructor(
		public readonly title: string,
		public readonly state: vscode.TreeItemCollapsibleState,
		public readonly nesting_level: number,
		public readonly command?: vscode.Command,
		public readonly context?: string,
	) {
		super(title, state);
	}

	public children: MapItem[] = [];
	public parent: MapItem;
	// iconPath = {
	// 	light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'document.svg'),
	// 	dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'document.svg')
	// };
	public updateState(): void {
		if (this.children.length == 0)
			this.collapsibleState = vscode.TreeItemCollapsibleState.None;
	}
	contextValue = 'file';
}