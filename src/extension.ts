'use strict';

import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { FavoritesTreeProvider, MapItem, MapInfo } from './tree_view';
import { Uri, commands } from 'vscode';
import { mapper } from './mapper_ts';

function get_favorites_items(): MapInfo {

    try {

        let document = vscode.window.activeTextEditor.document.fileName;
        
        // return { sourceFile: document, items: [
        //     "class Printer       :1",
        //     " Name()             :2",
        //     " Name2()             :2",
        //     "class Driver        :3",
        //     " Index()            :4",
        //     " class Nested       :5",
        //     "  Name()            :6",
        //     "  Start()           :7",
        //     "class Printer       :8",
        //     " Name()             :10",
        //     " Print()            :11"
        // ] };

        if (document && fs.existsSync(document))
            return { sourceFile: document, items: mapper.generate(document) };
    } catch (error) {
        return { sourceFile: null, items: [] };
    }
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

function remove(element: MapItem) {
    let lines: string[] = [];

    // Utils.read_all_lines(Utils.fav_file)
    //     .forEach(x => {
    //         if (x != element.context)
    //             lines.push(x);
    //     });

    // Utils.write_all_lines(Utils.fav_file, lines);

    // commands.executeCommand('favorites.refresh');
}

export function activate(context: vscode.ExtensionContext) {

    const treeViewProvider = new FavoritesTreeProvider(get_favorites_items);

    vscode.window.registerTreeDataProvider('codemap', treeViewProvider);

    vscode.commands.registerCommand('codemap.refresh', () => treeViewProvider.refresh());
    vscode.commands.registerCommand('codemap.remove', remove);
    vscode.commands.registerCommand('codemap.navigate_to', navigate_to);
}

