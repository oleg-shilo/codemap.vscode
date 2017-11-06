'use strict';

import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { FavoritesTreeProvider, MapItem, MapInfo } from './tree_view';
import { Uri, commands } from 'vscode';
import * as ts from './mapper_ts';
import * as py from './mapper_generic';
import { SyntaxMapping } from './mapper_generic';

function get_map_items(): MapInfo {
    
    let result = { sourceFile: null, items: [] };

    try {

        let config = vscode.workspace.getConfiguration("codemap");
        
        let document = vscode.window.activeTextEditor.document.fileName;
        
        if (document && fs.existsSync(document)) {
            
            let extension = path.extname(document.toLowerCase());
            
            if (extension)
            {
                // Trim starting dot: '.py' vs 'py'
                let mappings: SyntaxMapping[] = config.get(extension.substring(1), null); 
                if (mappings)
                    return { sourceFile: document, items: py.mapper.generate(document, mappings) };
            }

            if (document.toLowerCase().endsWith('.ts'))
                return { sourceFile: document, items: ts.mapper.generate(document) };
        }
    } catch (error) {
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

    const treeViewProvider = new FavoritesTreeProvider(get_map_items);

    vscode.window.registerTreeDataProvider('codemap', treeViewProvider);

    vscode.commands.registerCommand('codemap.refresh', () => treeViewProvider.refresh());
    vscode.commands.registerCommand('codemap.navigate_to_selected', navigate_to_selected);
    vscode.commands.registerCommand('codemap.navigate_to', navigate_to);
}

