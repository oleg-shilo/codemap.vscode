"use strict";

import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { FavoritesTreeProvider, MapItem, MapInfo, SortDirection, SettingsTreeProvider, SettingsItem } from "./tree_view";
import { Uri, commands, TextDocument, TextEditor } from "vscode";
import * as ts from "./mapper_ts";
import * as cs from "./mapper_cs";
import * as generic from "./mapper_generic";
import * as md from "./mapper_md";
import { SyntaxMapping } from "./mapper_generic";
import { Utils, config_defaults } from "./utils";

const defaults = new config_defaults();
let treeViewProvider1: FavoritesTreeProvider;
let treeViewProvider2: FavoritesTreeProvider;
let settingsTreeViewProvider: SettingsTreeProvider;
let moduleModDates = {};

function get_actual_mapper(mapper: any): any {
    if (typeof mapper == "string") {
        let mapper_value = mapper as string;
        if (mapper_value.startsWith("config:codemap.")) {
            let config = vscode.workspace.getConfiguration("codemap");
            let linked_config_value = mapper_value.replace("config:codemap.", "");
            return config.get(linked_config_value, defaults.get(linked_config_value));
        }
        return mapper;
    } else return mapper;
}

function requireWithHotReload(module: string) {
    // Delete from module cache if the file has changed since the last time it
    // was imported:
    let modulePath = require.resolve(module);
    let modDate = fs.statSync(modulePath).mtimeMs;
    let prevModDate = moduleModDates[modulePath];
    if (prevModDate !== undefined && prevModDate !== modDate) {
        delete require.cache[modulePath];
    }
    moduleModDates[modulePath] = modDate;

    return require(module);
}

function settings_on_click(item: SettingsItem) {
    item.onClick();
    settingsTreeViewProvider.refresh(item);
}


function get_map_items(): MapInfo {
    let result = { sourceFile: null, items: [] };

    try {
        let config = vscode.workspace.getConfiguration("codemap");

        let document = vscode.window.activeTextEditor.document.fileName;

        if (document) {

            let value_name = "";

            if (fs.existsSync(document)) {
                var extension = path.extname(document.toLowerCase());
                if (extension) {
                    // Trim starting dot: '.py' vs 'py'
                    value_name = extension.substring(1).toLowerCase();
                }
                else {
                    // Add bracket: 'Makefile' vs '(Makefile)'
                    value_name = "(" + path.basename(document) + ")";
                }
            } else {
                value_name = vscode.window.activeTextEditor.document.languageId;
            }

            let mapper = config.get("overloaded." + value_name, null);

            if (mapper == null)
                mapper = config.get(value_name, defaults.get(value_name));

            mapper = get_actual_mapper(mapper);
            if (mapper) {
                if (typeof mapper == "string") {
                    // custom dedicated mapper
                    // process.env.VSCODE_USER
                    var dynamic_mapper = requireWithHotReload(mapper as string).mapper;
                    return {
                        sourceFile: document,
                        items: dynamic_mapper.generate(document)
                    };
                } else {
                    // generic built-in mapper
                    let mapping_info = mapper as SyntaxMapping[];
                    return {
                        sourceFile: document,
                        items: generic.mapper.generate(document, mapping_info)
                    };
                }
            }

            if (
                document.toLowerCase().endsWith(".ts") ||
                document.toLowerCase().endsWith(".js")
            ) {
                // dedicated built-in mapper
                return { sourceFile: document, items: ts.mapper.generate(document) };
            }

            if (document.toLowerCase().endsWith(".cs")) {
                // dedicated built-in mapper
                return { sourceFile: document, items: cs.mapper.generate(document) };
            }

            if (document.toLowerCase().endsWith(".razor")) {

                let codeFile = document + ".codemap.cs";
                let code = [];

                let started = false;

                Utils
                    .read_all_lines(document)
                    .forEach(line => {
                        if (line.trimStart().startsWith("@code {")) {

                            started = true;
                            code.push("class @code {");
                        }
                        else {

                            if (started)
                                code.push(line);
                            else
                                code.push("");
                        }
                    });

                Utils.write_all_lines(codeFile, code);
                let map = cs.mapper.generate(codeFile);
                fs.unlinkSync(codeFile);

                // dedicated built-in mapper
                return { sourceFile: document, items: map };
            }
        }
    } catch (error) {
        console.log(error.toString());
    }
    return result;
}

function navigate_to(sourceFile: string, line: number) {

    let activeEditor: Thenable<TextEditor>;

    if (sourceFile != null && fs.existsSync(sourceFile))
        activeEditor = vscode.workspace.openTextDocument(Uri.file(sourceFile))
            .then(document => vscode.window.showTextDocument(document));
    else
        activeEditor = vscode.window.showTextDocument(vscode.window.activeTextEditor.document);

    activeEditor
        .then(editor =>
            vscode.commands
                .executeCommand("revealLine", {
                    lineNumber: Math.floor(line),
                    at: "center"
                })
                .then(() => editor)
        )
        .then(editor => {
            if (editor) {
                editor.selection = new vscode.Selection(
                    new vscode.Position(Math.floor(line), 0),
                    new vscode.Position(Math.floor(line), 0)
                );

                commands.executeCommand('editor.unfold');
            }
        });
}

function navigate_to_selected(element: MapItem) {
    // source_file + '|' + lineNumber
    let items = element.context.split("|");
    let sourceFile = items[0];
    let line = Number(items[1]);

    let activeEditor: Thenable<TextEditor>;

    if (sourceFile != null && fs.existsSync(sourceFile))
        activeEditor = vscode.workspace.openTextDocument(Uri.file(sourceFile))
            .then(document => vscode.window.showTextDocument(document));
    else
        activeEditor = vscode.window.showTextDocument(vscode.window.activeTextEditor.document);

    activeEditor
        .then(editor =>
            vscode.commands
                .executeCommand("revealLine", {
                    lineNumber: Math.floor(line),
                    at: "center"
                })
                .then(() => editor)
        )
        .then(editor => {
            if (editor) {
                editor.selection = new vscode.Selection(
                    new vscode.Position(Math.floor(line), 0),
                    new vscode.Position(Math.floor(line), 0)
                );
            }
        });
}

function reveal_current_line_in_tree(treeView1: vscode.TreeView<MapItem>, treeView2: vscode.TreeView<MapItem>) {

    let editor = vscode.window.activeTextEditor;

    if (editor != null) {

        let currentLine = editor.selection.active.line;

        if (treeView1.visible)
            treeViewProvider1.revealNodeOf(treeView1, currentLine);

        if (treeView2.visible)
            treeViewProvider2.revealNodeOf(treeView2, currentLine);
    }
}

function sort(direction: SortDirection) {
    MapItem.sortDirection = direction;
    settingsTreeViewProvider.refresh();  // triggers both codemap trees refesh
}

function quick_pick() {

    let info = get_map_items();

    if (info == null || info.items.length == 0)
        return;

    let map = new Map();

    info.items.forEach(item => {

        if (item != '') {
            let tokens = item.split('|');
            let icon = "";

            if (tokens[2] == "function") icon = "$(symbol-function) ";
            else if (tokens[2] == "property") icon = "$(symbol-property) ";
            else if (tokens[2] == "interface") icon = "$(symbol-interface) ";
            else if (tokens[2] == "class") icon = "$(symbol-class) ";
            else if (tokens[2] == "document") icon = "$(symbol-file) ";
            else if (tokens[2] == "level1") icon = "$(circle-filled) ";
            else if (tokens[2] == "level2") icon = "$(circle-outline) ";
            else if (tokens[2] == "level3") icon = "$(debug-stackframe-dot) ";

            if (tokens.length > 1) {
                try {
                    // https://code.visualstudio.com/api/references/icons-in-labels
                    map.set(icon + tokens[0], () => navigate_to(info.sourceFile, Number(tokens[1]) - 1));
                } catch (error) {
                }
            }
        }
    });

    vscode.window
        .showQuickPick(Array.from(map.keys()))
        .then(selectedItem => map.get(selectedItem)());
}

function allow_all() {
    let document = vscode.window.activeTextEditor.document.fileName;
    if (document) {
        if (fs.existsSync(document)) {
            settingsTreeViewProvider.allow_all(document);
        }
    }
}

let mapInfo: MapInfo;

export function activate(context: vscode.ExtensionContext) {
    Utils.init();

    settingsTreeViewProvider = new SettingsTreeProvider(get_map_items);
    let settingsTree1 = vscode.window.createTreeView("codemap-settings-own-view", { treeDataProvider: settingsTreeViewProvider, showCollapseAll: true });
    let settingsTree2 = vscode.window.createTreeView("codemap-settings-explorer-view", { treeDataProvider: settingsTreeViewProvider, showCollapseAll: true });

    treeViewProvider1 = new FavoritesTreeProvider(get_map_items, settingsTreeViewProvider);
    treeViewProvider2 = new FavoritesTreeProvider(get_map_items, settingsTreeViewProvider);
    let treeView1 = vscode.window.createTreeView("codemap-own-view", { treeDataProvider: treeViewProvider1, showCollapseAll: true });
    let treeView2 = vscode.window.createTreeView("codemap-explorer-view", { treeDataProvider: treeViewProvider2, showCollapseAll: true });

    vscode.commands.registerCommand("codemap.reveal", () => reveal_current_line_in_tree(treeView1, treeView2));
    vscode.commands.registerCommand("codemap.quick_pick", quick_pick);
    // settings tree forces refresh on codemap tree:
    vscode.commands.registerCommand("codemap.refresh", () => settingsTreeViewProvider.refresh());

    vscode.commands.registerCommand("codemap.sort_location", () => sort(SortDirection.ByLocation));
    vscode.commands.registerCommand("codemap.sort_asc", () => sort(SortDirection.Asc));
    vscode.commands.registerCommand("codemap.sort_desc", () => sort(SortDirection.Desc));

    vscode.commands.registerCommand("codemap.allow_all", () => allow_all());

    vscode.commands.registerCommand("codemap.mappers", () => {
        let mappers = vscode.workspace.getConfiguration("codemap");
        vscode.workspace.openTextDocument({ language: 'json', content: "// current Code Map configuration (read-only)\n" + JSON.stringify(mappers, null, 2) })
            .then(doc => vscode.window.showTextDocument(doc));
    });

    vscode.window.onDidChangeTextEditorSelection(editor => {
        let autoReveal = vscode.workspace.getConfiguration("codemap").get('autoReveal', defaults.get('autoReveal'));
        if (autoReveal)
            vscode.commands.executeCommand("codemap.reveal");
    });

    vscode.commands.registerCommand("codemap.navigate_to_selected", navigate_to_selected);
    vscode.commands.registerCommand("codemap.navigate_to", navigate_to);
    vscode.commands.registerCommand("codemap.settings_on_click", settings_on_click);
}