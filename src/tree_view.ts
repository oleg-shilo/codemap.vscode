import * as vscode from 'vscode';
import * as path from 'path';
import { Config, config_defaults } from './utils';

const defaults = new config_defaults();

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

export class SettingsTreeProvider implements vscode.TreeDataProvider<SettingsItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SettingsItem | undefined> = new vscode.EventEmitter<SettingsItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<SettingsItem | undefined> = this._onDidChangeTreeData.event;
    private _settings: { [filename: string]: { [nodeType: string]: boolean } };


    constructor(private aggregateItems: () => MapInfo) {
        this._settings = {};
        vscode.window.onDidChangeActiveTextEditor(e => {
            this._onDidChangeTreeData.fire();
        });
        vscode.workspace.onDidSaveTextDocument(e => {
            this._onDidChangeTreeData.fire();
        });
    }

    public nodeTypesAllowedByUser(filename: string): string[] {
        if (this._settings[filename] != undefined) {
            let nodeTypesAllowed: string[] = [];
            for (let key in this._settings[filename]) {
                if (this._settings[filename][key]) {
                    nodeTypesAllowed.push(key);
                }
            }
            return nodeTypesAllowed;
        }
        else {
            this.getSettingItems();
            // manually trigger settings tree update for file
            return this.nodeTypesAllowedByUser(filename);
        }

    }

    public allow_all(filename: string) {
        for (let key in this._settings[filename]) {
            this._settings[filename][key] = true;
        }
        this.refresh();
    }

    public getTreeItem(element: SettingsItem): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: SettingsItem): Thenable<SettingsItem[]> {
        return new Promise(resolve => {
            if (element) {
                resolve([]);  // no children
            } else {
                let items = this.getSettingItems();
                resolve(items);
            }
        });
    }

    public getSettingItems(): SettingsItem[] {
        let codeMapTree = this.aggregateItems();
        const filename: string = codeMapTree.sourceFile;

        if (filename == null) {
            return [];
        }

        let codeMapTypes: Set<string> = new Set<string>();
        codeMapTree['items'].filter((strItem) => strItem != '').forEach(
            (x) => { codeMapTypes.add(x.trimStart().split("|")[2]); }
        );

        let ArrCodeMapTypes = Array.from(codeMapTypes);

        // "backup" settings defined here. This is done to keep the settings chosen that aren't the default
        // available for reinstatement after a whole tree rebuild is triggered by a file save or window change.
        // Sadly we need this hack rather than only causing a rebuild on changed nodes as more nodes may
        // have been added.
        if (!(Object.keys(this._settings).includes(filename))) {
            this._settings[filename] = {};
        }

        if (Object.keys(this._settings[filename]).length == 0) {  // if no prior settings
            ArrCodeMapTypes.forEach(x => { this._settings[filename][x] = true; });
        }
        else {  // if prior settings reinstate them
            ArrCodeMapTypes.forEach(x => {
                {
                    if (!Object.keys(this._settings[filename]).includes(x)) {
                        {
                            this._settings[filename][x] = true;
                        }
                    }
                }
            });
        }

        return ArrCodeMapTypes.sort().map(
            (x) => new SettingsItem(
                x, this._settings[filename][x],
                (nodeType: string) => this.addToNodeTypesAllowed(nodeType, filename),
                (nodeType: string) => this.removeFromNodeTypesAllowed(nodeType, filename)
            ));
    }

    public addToNodeTypesAllowed(nodeType: string, filename: string): void {
        this._settings[filename][nodeType] = true;
    }

    public removeFromNodeTypesAllowed(nodeType: string, filename: string): void {
        this._settings[filename][nodeType] = false;
    }

    public refresh(item?: SettingsItem): void {
        try {
            this._onDidChangeTreeData.fire(item);
        } catch (error) {

        }
    }
}

export class FavoritesTreeProvider implements vscode.TreeDataProvider<MapItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<MapItem | undefined> = new vscode.EventEmitter<MapItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<MapItem | undefined> = this._onDidChangeTreeData.event;
    private MapSettingsTreeProvider: SettingsTreeProvider;
    public Items: MapItem[];

    constructor(private aggregateItems: () => MapInfo, MapSettingsTreeProvider: SettingsTreeProvider) {
        // codemap tree is triggered once settings are generated:
        this.MapSettingsTreeProvider = MapSettingsTreeProvider;
        MapSettingsTreeProvider.onDidChangeTreeData(
            (e) => this._onDidChangeTreeData.fire()
        );
    }

    refresh(): void {
        try {
            this._onDidChangeTreeData.fire();
        } catch (error) {

        }
    }

    getTreeItem(element: MapItem): vscode.TreeItem {
        return element;
    }

    getParent?(element: MapItem): Thenable<MapItem> {
        return new Promise(resolve => {
            resolve(element.parent);
        });
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

    public revealNodeOf(treeView: vscode.TreeView<MapItem>, lineNumber: number): void {
        treeView.reveal(this.getItemOf(lineNumber), { select: true, focus: false, expand: true })
    }

    public getItemOf(lineNumber: number): MapItem {

        let allItems: MapItem[] = [];
        for (let index = 0; index < this.Items.length; index++) {
            let item = this.Items[index];
            allItems.push(item);
            item.aggregateNestedChildren(allItems);
        }

        allItems = allItems.sort(MapItem.compareByLineNumber);

        let result: MapItem;

        if (allItems.length > 0)
            result = allItems[0];

        for (let index = 0; index < allItems.length; index++) {
            const element = allItems[index];

            if (element.lineNumber > lineNumber)
                break;

            result = element;
        }
        return result;
    }

    private getScriptItems(): MapItem[] {
        let nodes = [];

        // let refsNode = new MapItem('References', vscode.TreeItemCollapsibleState.Collapsed, 0, null, 'assembly_group');
        // nodes.push(refsNode);

        let info = this.aggregateItems();

        if (info == null || info.items.length == 0)
            return nodes;

        let validItemTypes = this.MapSettingsTreeProvider.nodeTypesAllowedByUser(info.sourceFile);
        this.Items = FavoritesTreeProvider.parseScriptItems(info.items, info.sourceFile, validItemTypes);
        return this.Items;
    }

    public static process_node(
        node : MapItem,
        nodes : MapItem[],
        map_hierarchy : MapItem[]
    ): void {
        let level_indent = node.level_indent;
        let level_hierarchy = node.level_hierarchy;

        if (!(map_hierarchy.length)) {
            nodes.push(node)

            if (level_hierarchy)
            {
                node = nodes[nodes.length - 1]
                map_hierarchy.push(node)
            }
        }
        else if (map_hierarchy.length) {
            // Let us get parent
            let parent : MapItem = map_hierarchy[map_hierarchy.length - 1];

            if (level_indent > parent.level_indent)
            {
                if (level_hierarchy)
                {
                    map_hierarchy.push(node);
                }

                parent.addChildItem(node);
                node.parent = parent;

            }
            else if (level_indent == parent.level_indent)
            {
                if (level_hierarchy)
                {
                    if  (level_hierarchy < parent.level_hierarchy)
                    {
                        map_hierarchy.pop()
                        FavoritesTreeProvider.process_node(
                            node,
                            nodes,
                            map_hierarchy
                        )
                    }
                    else if (level_hierarchy == parent.level_hierarchy)
                    {
                        if (parent.parent) {
                            parent.parent.addChildItem(node)
                            node.parent = parent.parent
                        }
                        else {
                            nodes.push(node)
                        }

                        map_hierarchy.pop()
                    }
                    else
                    {
                        // TODO Implementing outline type, that different types
                        // TODO will not race hierarchy (nestable will not nest
                        // TODO the other type on same indent level)
                        parent.addChildItem(node);
                        node.parent = parent;
                    }

                    map_hierarchy.push(node)
                }
                else
                {
                    parent.addChildItem(node);
                    node.parent = parent;
                }
            }
            else if (level_indent < parent.level_indent)
            {
                map_hierarchy.pop()
                FavoritesTreeProvider.process_node(node, nodes, map_hierarchy)

            }
        }
    }

    public static parseScriptItems(items: string[], sourceFile: string, nodeTypesToKeep: string[]): MapItem[] {

        let nodes = [];

        // https://github.com/Microsoft/vscode/issues/34130: TreeDataProvider: allow selecting a TreeItem without affecting its collapsibleState
        // https://github.com/patrys/vscode-code-outline/issues/24: Is it possible to disable expand/collapse on click
        // Until above items are fixed need to go with the plain text.
        let plainTextMode = vscode.workspace.getConfiguration("codemap").get('textMode', defaults.get('textMode'));
        let max_hierarchy_level = vscode.workspace.getConfiguration("codemap").get('maxNestingLevel', defaults.get('maxNestingLevel'));

        // default is empty (non-white space) character U+00A0; to avoid trimming by treeview renderer
        let levelUnitChar = vscode.workspace.getConfiguration("codemap").get('textModeLevelPrefix', defaults.get('textModeLevelPrefix'));

        // Intelligently taking tab size (in terms of number of spaces) from active text editor
        let levelUnit : number;
        let levelUnit_t = vscode.window.activeTextEditor.options.tabSize;

        // Language
        let editor_language = vscode.window.activeTextEditor.document.languageId;

        if (typeof levelUnit_t === "string")
        {
            // TODO Set indentation according to language or
            // TODO scrape it from document
            editor_language;

            levelUnit = 4;
        }
        else
        {
            levelUnit = levelUnit_t
        }
        let map: { [index: number]: MapItem; } = {};
        let map_hierarchy = [];

        items.forEach(item => {

            if (item != '') {
                let source_file = sourceFile;
                let tokens = item.split('|');

                let lineNumber = 0;
                let icon = 'document';
                let title: string;
                let level_indent = item.length - item.trimStart().length;
                let level_hierarchy:number = 0;
                if (tokens.length > 1) {
                    try {
                        title = tokens[0];
                        lineNumber = Number(tokens[1]) - 1;
                        icon = tokens[2];
                        level_hierarchy = Number(tokens[3]);
                    } catch (error) {
                    }
                }
                else
                    source_file = null;

                // if (level_indent != 0) {
                //     if (!levelUnit)
                //         levelUnit = level_indent;
                //     level_indent = level_indent / levelUnit;
                // }

                if (level_hierarchy > max_hierarchy_level)
                    return;

                // the normal spaces are collapsed by the tree item renderer
                let non_whitespace_empty_char = levelUnitChar;

                if (!plainTextMode)
                    title = title.trimStart();

                let on_click_command = 'codemap.navigate_to';
                if (lineNumber == -1)
                    on_click_command = "";

                let textModeExpanded = vscode.workspace.getConfiguration("codemap").get('textModeExpanded', defaults.get('textModeExpanded'));

                title = title.replace('%pipe%', '|');

                let node = new MapItem(
                    title,
                    textModeExpanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed,
                    level_indent,
                    level_hierarchy,
                    {
                        command: on_click_command,
                        title: '',
                        // tooltip: file,
                        arguments: [source_file, lineNumber],
                    },
                    source_file + '|' + lineNumber,
                    lineNumber
                );

                if (nodeTypesToKeep.includes(icon)) {
                    if (plainTextMode) {
                        node.collapsibleState = vscode.TreeItemCollapsibleState.None;
                        node.label = non_whitespace_empty_char.repeat(Math.floor(level_indent / levelUnit)) + title;
                        nodes.push(node);
                    }
                    else {

                        FavoritesTreeProvider.process_node(
                            node,
                            nodes,
                            map_hierarchy
                        )

                        // if (level_indent == 0) {
                        //     nodes.push(node);
                        // }
                        // else {
                        //     let parent = map[node.nesting_level - 1];
                        //     if (!parent) {
                        //         for (let key in map) {
                        //             parent = map[key];
                        //         }
                        //     }
                        //     parent.addChildItem(node);
                        //     node.parent = parent;
                        // }
                    }
                }

                if (icon.startsWith("path:")) {

                    node.iconPath = {
                        light: icon.replace("path:", "").replace("{theme}", "light"),
                        dark: icon.replace("path:", "").replace("{theme}", "dark")
                    };
                }
                else {
                    let iconName = icon + ".svg";

                    node.iconPath = {
                        light: path.join(__filename, '..', '..', '..', 'resources', 'light', iconName),
                        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', iconName)
                    };
                }

                map[node.level_indent] = node;
            }
        });

        let sortingEnabled = Config.get('sortingEnabled');
        if (sortingEnabled && !plainTextMode) {
            nodes.sort(MapItem.compareByTitle);
        }

        return nodes;
    }
}


export enum SortDirection {
    ByLocation,
    Desc,
    Asc
}

function getDefaultSortDirection() {
    let dir: string = Config.get('defaultSortDirection').toString();
    return SortDirection[dir];
}

// TODO Implementing outline type, that different types will not
// TODO race hierarchy (nestable will not nest the other type on same
// TODO indent level)
export class MapItem extends vscode.TreeItem {

    constructor(
        public readonly title: string,
        public readonly state: vscode.TreeItemCollapsibleState,
        public readonly level_indent: number,
        public readonly level_hierarchy: number,
        public readonly command?: vscode.Command,
        public readonly context?: string,
        public readonly lineNumber?: number) {
        super(title, state);
    }

    public static sortDirection: SortDirection = getDefaultSortDirection();

    public children: MapItem[] = [];
    public sortedByFilePositionChildren: MapItem[] = [];
    public parent: MapItem;

    public updateState(): void {
        if (this.children.length == 0)
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    public addChildItem(item: MapItem) {
        this.children.push(item);

        let sortingEnabled = Config.get('sortingEnabled');
        if (sortingEnabled) {
            // not very efficient to do it on every child added but OK as a starting point
            this.children = this.children.sort(MapItem.compareByTitle);
        }
    }

    public aggregateNestedChildren(result: MapItem[]): void {
        for (let index = 0; index < this.children.length; index++) {
            var element = this.children[index];
            result.push(element);
            element.aggregateNestedChildren(result);
        }
    }

    public static compareByLineNumber(n1: MapItem, n2: MapItem): number {
        if (n1.lineNumber > n2.lineNumber)
            return 1;

        if (n1.lineNumber < n2.lineNumber)
            return -1;

        return 0;
    }

    public static compareByTitle(n1: MapItem, n2: MapItem): number {

        if (MapItem.sortDirection == SortDirection.Asc) {
            return MapItem.compareByTitleAsc(n1, n2);
        }
        else if (MapItem.sortDirection == SortDirection.Desc) {
            return MapItem.compareByTitleAsc(n2, n1);
        }

    }

    public static compareByTitleAsc(n1: MapItem, n2: MapItem): number {
        if (n1.title.toUpperCase() > n2.title.toUpperCase())
            return 1;

        if (n1.title.toUpperCase() < n2.title.toUpperCase())
            return -1;

        return 0;
    }

    contextValue = 'file';
}

function getSettingsIconPathFromName(include: boolean): { light: string, dark: string } {
    if (include) {
        return {
            light: path.join(__filename, '..', '..', '..', 'resources', 'light', "circle-filled" + ".svg"),
            dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', "circle-filled" + ".svg")
        };
    }
    else {
        return {
            light: path.join(__filename, '..', '..', '..', 'resources', 'light', "circle-outline" + ".svg"),
            dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', "circle-outline" + ".svg")
        };
    }
}

export class SettingsItem extends vscode.TreeItem {
    constructor(
        public readonly title: string,
        public include: boolean,
        private AddValidType: Function,
        private RemoveValidType: Function
    ) {
        // no collapsible state
        super(title, vscode.TreeItemCollapsibleState.None);
        this.iconPath = getSettingsIconPathFromName(include);
        this.command = {
            title: title,
            command: 'codemap.settings_on_click',
            arguments: [this]
        };
    }
    public readonly command: vscode.Command;
    public onClick() {
        this.include = !this.include;

        if (!this.include) {
            this.RemoveValidType(this.title);
        }
        else {
            this.AddValidType(this.title);
        }

        this.iconPath = getSettingsIconPathFromName(this.include);
    }
}
