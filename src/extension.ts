'use strict';

import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { FavoritesTreeProvider, MapItem, MapInfo } from './tree_view';
import { Uri, commands } from 'vscode';
import * as ts from './mapper_ts';
import * as cs from './mapper_cs';
import * as generic from './mapper_generic';
import * as md from './mapper_md';
import { SyntaxMapping } from './mapper_generic';
import { Utils } from './utils';

function get_map_items(): MapInfo {

    let result = { sourceFile: null, items: [] };

    try {

        let config = vscode.workspace.getConfiguration("codemap");

        let document = vscode.window.activeTextEditor.document.fileName;

        if (document && fs.existsSync(document)) {

            let extension = path.extname(document.toLowerCase());

            if (extension) {
                // Trim starting dot: '.py' vs 'py'
                let mapper = config.get(extension.substring(1), null);
                if (mapper) {
                    if (typeof mapper == "string") { // custom dedicated mapper
                        // process.env.VSCODE_USER
                        var dynamic_mapper = require(mapper as string).mapper;
                        return { sourceFile: document, items: dynamic_mapper.generate(document) };
                    }
                    else { // generic built-in mapper
                        let mapping_info = mapper as SyntaxMapping[];
                        return { sourceFile: document, items: generic.mapper.generate(document, mapping_info) };
                    }
                }
            }

            if (document.toLowerCase().endsWith('.ts') || document.toLowerCase().endsWith('.js')) {
                // dedicated built-in mapper
                return { sourceFile: document, items: ts.mapper.generate(document) };
            }

            if (document.toLowerCase().endsWith('.cs')) {
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

    // vscode.commands.executeCommand('vscode.open', Uri.file(sourceFile));5

    if (sourceFile != null) {
        vscode.workspace.openTextDocument(Uri.file(sourceFile))
            .then(document => vscode.window.showTextDocument(document))
            .then(editor =>
                vscode.commands.executeCommand('revealLine', { lineNumber: Math.floor(line), at: 'center' })
                    .then(() => editor))
            .then(editor => {
                if (editor) {
                    editor.selection = new vscode.Selection(
                        new vscode.Position(Math.floor(line), 0),
                        new vscode.Position(Math.floor(line), 0));
                }
            });
    }
}

function navigate_to_selected(element: MapItem) {
    // source_file + '|' + lineNumber
    let items = element.context.split('|')
    let sourceFile = items[0];
    let line = Number(items[1]);

    if (sourceFile != null) {
        vscode.workspace.openTextDocument(Uri.file(sourceFile))
            .then(document => vscode.window.showTextDocument(document))
            .then(editor =>
                vscode.commands.executeCommand('revealLine', { lineNumber: Math.floor(line), at: 'center' })
                    .then(() => editor))
            .then(editor => {
                if (editor) {
                    editor.selection = new vscode.Selection(
                        new vscode.Position(Math.floor(line), 0),
                        new vscode.Position(Math.floor(line), 0));
                }
            });
    }
}

export function activate(context: vscode.ExtensionContext) {

    Utils.init();

    const treeViewProvider = new FavoritesTreeProvider(get_map_items);

    vscode.window.registerTreeDataProvider('codemap', treeViewProvider);

    vscode.commands.registerCommand('codemap.refresh', () => treeViewProvider.refresh());
    vscode.commands.registerCommand('codemap.navigate_to_selected', navigate_to_selected);
    vscode.commands.registerCommand('codemap.navigate_to', navigate_to);
}

