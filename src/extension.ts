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

            let mapper = get_required_mapper_type();

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

            if (document.toLowerCase().endsWith(".ts") || document.toLowerCase().endsWith(".js")) {
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
    settingsTreeViewProvider.refresh();  // triggers both codemap trees refresh
}

function getAllExtensionCombinations(fileName: string): string[] {
    // this method extracts all possible extensions from a file name
    // e.g. "test.g.cs" -> ["g.cs", "cs"]

    let parts = fileName.split('.');
    parts.shift(); // Remove the first part (the file name itself)

    let extensions: string[] = [];

    while (parts.length > 0) {
        // Add the full extension 
        // Escape dots as value names with dots are not allowed in settings.json)
        // Interestingly enough VSCode is fine with some dot-containing names (e.g. "debug.javascript.suggestPrettyPrinting")

        // push if it is not there yet
        let item = parts.join('/');
        if (!extensions.includes(item)) {
            extensions.push(item);
        }

        // do not escape dots as VSCode may fix it and start supporting dots in the future
        item = parts.join('.');
        if (!extensions.includes(item)) {
            extensions.push(item);
        }

        parts.shift();
    }

    return extensions;
}

function get_required_mapper_type(returnIdOnly: boolean = false): string {

    let document = vscode.window.activeTextEditor.document.fileName;
    let config = vscode.workspace.getConfiguration("codemap");

    let possibleExtensions = []; // to allow testing for complex extensions like '.razor.cs' 

    if (document) {
        if (fs.existsSync(document)) {
            // var extension = path.extname(document.toLowerCase());
            var extensions = getAllExtensionCombinations(path.basename(document).toLowerCase());
            if (extensions.length > 0) {
                // Trim starting dot: '.py' vs 'py'
                extensions.forEach(extension =>
                    possibleExtensions.push(extension.toLowerCase()));
            }
            else {
                // Add bracket: 'Makefile' vs '(Makefile)'
                possibleExtensions.push("(" + path.basename(document) + ")");
            }
        } else {
            possibleExtensions.push(vscode.window.activeTextEditor.document.languageId);
        }
    }

    let extension = null;
    let mapper = null;
    for (let i = 0; i < possibleExtensions.length; i++) {

        extension = possibleExtensions[i];
        mapper = config.get("overloaded." + extension, null);

        if (mapper == null)
            mapper = config.get(extension, defaults.get(extension));

        if (mapper)
            break;
    }

    if (returnIdOnly) {
        return extension; // regardless if the mapper exists or not
    }
    else {
        return mapper;
    }
}

function edit_mapper() {

    try {

        let value_name = get_required_mapper_type(true);
        if (value_name) {

            let config = vscode.workspace.getConfiguration("codemap");
            let mapper = config.get("overloaded." + value_name, null);

            let settingsFile = path.join(cs.user_dir(), "..", "settings.json");
            let existingMapperIndex = -1;

            if (mapper == null) {
                mapper = config.get(value_name, defaults.get(value_name));

                let lines = fs.readFileSync(settingsFile, 'utf8').split(/\r?\n/g);

                let rgx = new RegExp('\"codemap\.' + value_name.toLowerCase() + '\":', "g");
                for (let i = 0; i < lines.length; i++) {
                    if (existingMapperIndex == -1 && lines[i].match(rgx)) {
                        existingMapperIndex = i;
                        break;
                    }
                }
            }

            mapper = get_actual_mapper(mapper);

            if (!mapper) {
                // dedicated built-in mappers
                if (value_name == "ts" || value_name == "js") {
                    mapper = "mapper_ts.js";
                } else if (value_name == "cs") {
                    mapper = "mapper_cs.js";
                }
            }

            if (mapper) {

                if (typeof mapper == "string") { // custom dedicated mapper (path string)

                    let file = mapper;
                    if (!path.isAbsolute(file)) {
                        file = path.join(__dirname, file);
                        vscode.window.showInformationMessage(`The file ${path.basename(file)} is a part of CodeMap distribution. 
                        It will be overwritten after the extension next update. Thus you may want to make an editable copy of`+
                            ' this file and add it as a custom dedicated mapper in the settings file.');

                    }
                    commands.executeCommand('vscode.open', Uri.file(file));
                }
                else { // Generic mapper (an object)
                    if (existingMapperIndex != null) { // the mapper is in the user settings file
                        commands.executeCommand('vscode.open', Uri.file(settingsFile))
                            .then(() => {
                                let editor = vscode.window.activeTextEditor;
                                let range = editor.document.lineAt(existingMapperIndex).range;
                                editor.selection = new vscode.Selection(range.start, range.end);
                                editor.revealRange(range);
                            });
                    } else {
                        vscode.commands.executeCommand('workbench.action.openSettings', 'codemap.' + value_name);
                    }
                }
                return;
            }
        }
        vscode.window.showErrorMessage(
            'The current document does not have associated CodeMap mapper. ' +
            'Use command "CodeMap: Create..." if you want to create a new mapper.');
    } catch (error) {
        console.log(error.toString());
    }
}

function create_mapper() {

    var mapper_type = get_required_mapper_type(true);
    var dedicated = 'Dedicated mapper (JS file)';
    var generic = 'Generic mapper (regular expression in the settings file)';

    vscode.window
        .showQuickPick([dedicated, generic])
        .then(selectedItem => {

            if (selectedItem == dedicated) {
                var doc = path.join(cs.user_dir(), `mapper_${mapper_type}.js`);
                if (fs.existsSync(doc)) {
                    vscode.window.showErrorMessage(
                        'The current document mapper already exists. Opening it instead of creating a new one.');
                }
                else {
                    var code = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class mapper {
    static read_all_lines(file) {
        let text = fs.readFileSync(file, 'utf8');
        return text.split(/\\r?\\n/g);
    }
    static generate(file) {
        let members = [];
        let line_num = 0;
        try {
            mapper
                .read_all_lines(file)
                .forEach(line => {
                    line_num++;
                    if(line_num < 3) // demo first 3 lines only 
                        members.push(\`item|\${line_num}|level3\`);
            });
        }
        catch (error) {
        }
        return members;
    }
}
exports.mapper = mapper;`;

                    fs.writeFileSync(doc, code, { encoding: 'utf8' });
                }
                commands.executeCommand('vscode.open', Uri.file(doc));
            }
            else if (selectedItem == generic) {

                let settingsFile = path.join(cs.user_dir(), "..", "settings.json");
                let lines = fs.readFileSync(settingsFile, 'utf8').split(/\r?\n/g);

                let rgx = new RegExp('\"codemap\.' + mapper_type.toLowerCase() + '\":', "g");
                let firstMapperIndex = -1;
                let existingMapperIndex = -1;
                for (let i = 0; i < lines.length; i++) {
                    if (firstMapperIndex == -1 && lines[i].match(/(\s*)\"\w+\.\w+\"\:(\s*)\[/g))
                        firstMapperIndex = i;
                    if (existingMapperIndex == -1 && lines[i].match(rgx)) {
                        existingMapperIndex = i;
                        break;
                    }
                }

                let selectedLine = 1;
                if (existingMapperIndex == -1) {
                    selectedLine = firstMapperIndex;
                } else {
                    selectedLine = existingMapperIndex;
                }

                commands.executeCommand('vscode.open', Uri.file(settingsFile))
                    .then(() => {

                        let editor = vscode.window.activeTextEditor;
                        let range = editor.document.lineAt(selectedLine).range;

                        if (existingMapperIndex == -1) {
                            range = editor.document.lineAt(selectedLine - 1).range; // one line above
                            editor.selection = new vscode.Selection(range.start, range.start);

                            const editRange = editor.document.lineAt(editor.selection.end.line).range.end;

                            editor.edit(editBuilder => {
                                if (editor !== undefined) {
                                    editBuilder.insert(editRange, `
  "codemap.${mapper_type.toLowerCase()}": [
     {
       "pattern": "function (.*?)[(|:{]",
       "clear": "({",
       "suffix": "()",
       "role": "function",
       "icon": "function"
      }
  ],`);
                                }

                            });
                            range = editor.document.lineAt(selectedLine).range;
                            editor.selection = new vscode.Selection(range.start, range.end);
                        }
                        else {
                            editor.selection = new vscode.Selection(range.start, range.end);
                            vscode.window.showErrorMessage(
                                'The current document mapper already exists. Opening it instead of creating a new one.');
                        }

                        editor.revealRange(range);
                    });

            }
        });
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

    vscode.commands.registerCommand("codemap.edit_mapper", edit_mapper);
    vscode.commands.registerCommand("codemap.create_mapper", create_mapper);

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