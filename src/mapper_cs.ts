/**
 * This file is a part of CodeMap distribution. 
 * It will be overwritten after the extension next update. Thus you may want to make an editable copy of
 * this file and add it as a custom dedicated mapper in the settings file.
*/
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fsx from "fs-extra";
import * as path from 'path';
import * as os from 'os';
import * as net from "net";
import * as mkdirp from "mkdirp";
import * as process from "process";
import * as child_process from "child_process"
import { Uri, commands } from "vscode";
import { Utils } from './utils';

let exec = require('child_process').exec;
let execSync = require('child_process').execSync;
let map = "";
let map_last_source = "";

let SYNTAXER_VERSION = "3.1.2.0";

// will be set at the end of this file
let SERVER = "";
let SEVER_CLI = "";

let HOST = '127.0.0.1';
let PORT = 18002;

export function startServer(showWarning): void {
    let proc = child_process.execFile("dotnet", [SERVER, "-port:" + PORT, "-listen", "-client:" + process.pid, "-timeout:60000"]);
    proc.on('exit', (code) => {
        console.log(`Child exited with code ${code}`);
    });

    let useNoDependencyCSharpMapper = vscode.workspace.getConfiguration("codemap").get('useNoDependencyCSharpMapper', false);

    if (!useNoDependencyCSharpMapper && showWarning)
        setTimeout(() => {
            if (proc.exitCode != null) {            // detect if proc is running
                vscode.window.showErrorMessage(`CodeMap C# (Roslyn-based) mapper failed to start ${SERVER}. 
                This can happen because it's build for .NET that is not present on your system. 
                To fix the problem either update 'syntaxer.runtimeconfig.json' or install the required .NET version. 
                Alternatively, you can switch to the C# mapper with no .NET dependency either in the 'codemap.useNoDependencyCSharpMapper' 
                settings or by executing 'Toggle C# Mapper Type' command, which toggles this setting for you.`);
            }
        }, 3000);
}

function copy_dir_to_sync(srcDir: string, destDir: string): void {

    try {
        fsx.copySync(srcDir, destDir);
    } catch (error) {
        console.log(error.toString());
    }
}

function delete_dir(dir: string): void {
    try {

        let files = fs.readdirSync(dir);
        for (let i = 0; i < files.length; i++) {

            let item_path = path.join(dir, files[i]);

            if (fs.lstatSync(item_path).isFile())
                try {
                    fs.unlinkSync(item_path);
                } catch (error) {
                }
            else
                delete_dir(item_path);
        }
        fs.rmdir(dir, () => { });
    } catch (error) {
        console.log(error);
    }
}



export class mapper {

    public static generate(file: string): string[] {

        var stats = fs.statSync(file);
        var map_source = file + stats.mtime;

        if (map_source != map_last_source) {
            map_last_source = map_source;
            map = "";
        }

        if (map == "") {

            // 18000 - Sublime Text 3
            // 18001 - Notepad++
            // 18002 - VSCode.CodeMap

            let command = `dotnet "${SEVER_CLI}" ${PORT} -client:${process.pid} -op:codemap_vscode -script:"${file}"`;

            try {

                map = execSync(command).toString();

            } catch (error) {
                console.log(error);
            }
        }
        return map.lines();
    }
}

export function user_dir(): string {
    // ext_context.storagePath cannot be used as it is undefined if no workspace loaded

    // vscode:
    // Windows %appdata%\Code\User\settings.json
    // Mac $HOME/Library/Application Support/Code/User/settings.json
    // Linux $HOME/.config/Code/User/settings.json

    if (os.platform() == 'win32') {
        return path.join(process.env.APPDATA, 'Code', 'User', 'codemap.user');
    }
    else if (os.platform() == 'darwin') {
        return path.join(process.env.HOME, 'Library', 'Application Support', 'Code', 'User', 'codemap.user');
    }
    else {
        return path.join(process.env.HOME, '.config', 'Code', 'User', 'codemap.user');
    }
}

function DeploySyntaxer() {

    function create_dir(dir: string): void {
        // fs.mkdirSync can only create the top level dir but mkdirp creates all child sub-dirs that do not exist
        const allRWEPermissions = parseInt("0777", 8);
        mkdirp.sync(dir, allRWEPermissions);
    }


    let fileName = "syntaxer.dll";
    let cliFileName = "syntaxer.cli.dll";
    let ext_dir = path.join(__dirname, "..", "..");
    let sourceDir = path.join(ext_dir, 'bin');
    let destRootDir = path.join(user_dir(), 'syntaxer');
    let destDir = path.join(destRootDir, SYNTAXER_VERSION);

    SERVER = path.join(destDir, fileName);
    SEVER_CLI = path.join(destDir, cliFileName);

    fs.readdir(destRootDir, (err, items) => {

        try {

            items.forEach(item => {
                try {

                    let item_path = path.join(destRootDir, item);

                    if (fs.lstatSync(item_path).isDirectory()) {

                        if (item != SYNTAXER_VERSION) { // remove old version folder
                            delete_dir(item_path);
                        }
                    }
                } catch (error) {
                }

            });
        } catch (error) {
        }
    });


    if (!fs.existsSync(SEVER_CLI)) {
        copy_dir_to_sync(sourceDir, destDir);
    }
    else {
        fsx.readdirSync(destRootDir, item => {
        });
    }

    if (fs.existsSync(SERVER)) {
        startServer(true);
        console.log("##### Syntaxer server started: " + SERVER);
    }
}

DeploySyntaxer();