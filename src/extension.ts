"use strict";

import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { FavoritesTreeProvider, MapItem, MapInfo } from "./tree_view";
import { Uri, commands, TextDocument, TextEditor } from "vscode";
import * as ts from "./mapper_ts";
import * as cs from "./mapper_cs";
import * as generic from "./mapper_generic";
import * as md from "./mapper_md";
import { SyntaxMapping } from "./mapper_generic";
import { Utils, config_defaults } from "./utils";

const defaults = new config_defaults();

function get_actual_mapper(mapper: any): any {
    if (typeof mapper == "string") {
        let mapper_value = mapper as string;
        if (mapper_value.startsWith("config:codemap.")) {
            // console.log(mapper_value);

            let config = vscode.workspace.getConfiguration("codemap");
            let linked_config_value = mapper_value.replace("config:codemap.", "");
            return config.get(linked_config_value, defaults.get(linked_config_value));
        }
        return mapper;
    } else return mapper;
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

            let mapper = config.get(value_name, defaults.get(value_name));

            mapper = get_actual_mapper(mapper);
            if (mapper) {
                if (typeof mapper == "string") {
                    // custom dedicated mapper
                    // process.env.VSCODE_USER
                    var dynamic_mapper = require(mapper as string).mapper;
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

export function activate(context: vscode.ExtensionContext) {
    Utils.init();

    const treeViewProvider = new FavoritesTreeProvider(get_map_items);

    vscode.window.createTreeView("codemap", { treeDataProvider: treeViewProvider, showCollapseAll: true });
    vscode.window.createTreeView("explorer", { treeDataProvider: treeViewProvider, showCollapseAll: true });

    // vscode.window.registerTreeDataProvider("codemap", treeViewProvider);

    vscode.commands.registerCommand("codemap.refresh", () => treeViewProvider.refresh());

    vscode.commands.registerCommand("codemap.mappers", () => {
        let mappers = vscode.workspace.getConfiguration("codemap");
        vscode.workspace.openTextDocument({ language: 'json', content: "// current Code Map configuration (read-only)\n" + JSON.stringify(mappers, null, 2) })
            .then(doc => vscode.window.showTextDocument(doc));
    });

    vscode.commands.registerCommand("codemap.navigate_to_selected", navigate_to_selected);

    vscode.commands.registerCommand("codemap.navigate_to", navigate_to);
}