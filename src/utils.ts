import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Uri, commands } from "vscode";



declare global {
    interface String {
        trimStart(): string;
        trimEnd(): string;
        replaceAll(search: string, replacement: string): string;
        lines(limit?: number): string[];
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

String.prototype.lines = function (limit?: number) {
    return this.split(/\r?\n/g, limit);
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

export class config_defaults {

    // Currently (4 May 2018) VSCode has broken returning defaults from the contributes.configuration.properties
    // It looks like issue #14500 is back
    // Thus implementing a poor man defaults

    public textMode = false;
    public sortingEnabled = false;
    public defaultSortDirection = "ByLocation";
    public textModeExpanded = true;
    public autoReveal = true;
    public textModeLevelPrefix = "   ";
    public json = [
        {
            "pattern": "\\s\\\"[\\w.-]*\":\\s[{|[]",
            "clear": "{|:|\"|\\[",
            "prefix": "",
            "icon": "level2"
        }
    ];
    public py = [
        {
            "pattern": "(?<![^\\r\\n\\t\\f\\v .])class (.*?)[(|:]",
            "clear": ":|(",
            "prefix": "",
            "role": "class",
            "icon": "class"
        },
        {
            "pattern": "def (.*?)[(|:]",
            "clear": ":|(",
            "suffix": "()",
            "role": "function",
            "icon": "function"
        }
    ];

    public svg = "config:codemap.xml";
    public xaml = "config:codemap.xml";
    public xml = [
        {
            "pattern": "\\s?<[^\\/|^\\?|^\\!][\\w:]*",
            "clear": "<",
            "prefix": "",
            "icon": "level3"
        }
    ];
    public md = [
        {
            "pattern": "^(\\s*)### (.*)",
            "clear": "###",
            "prefix": " -",
            "icon": "level3"
        },
        {
            "pattern": "^(\\s*)## (.*)",
            "clear": "##",
            "prefix": " ",
            "icon": "level2"
        },
        {
            "pattern": "^(\\s*)# (.*)",
            "clear": "#",
            "prefix": "",
            "icon": "level1"
        },
        {
            "pattern": "!\\[image\\]",
            "clear": "![image]",
            "prefix": "<image>",
            "icon": "none"
        },
        {
            "pattern": "!\\[\\]",
            "clear": "![]",
            "prefix": "<image>",
            "icon": "none"
        }
    ];

    public get(name: string): any {
        if (name == 'md') return this.md;
        else if (name == 'xml') return this.xml;
        else if (name == 'xaml') return this.xaml;
        else if (name == 'svg') return this.svg;
        else if (name == 'py') return this.py;
        else if (name == 'sortingEnabled') return this.sortingEnabled;
        else if (name == 'defaultSortDirection') return this.defaultSortDirection;
        else if (name == 'json') return this.json;
        else if (name == 'textModeLevelPrefix') return this.textModeLevelPrefix;
        else if (name == 'textMode') return this.textMode;
        else if (name == 'textModeExpanded') return this.textModeExpanded;
        else if (name == 'maxNestingLevel') return 3;
        else return null;
    }
}


export class Config {
    static defaults = new config_defaults();

    public static get(name: string, defaultValue: string = null): any {
        return vscode.workspace.getConfiguration("codemap").get(name, defaultValue ?? Config.defaults.get(name));
    }

    public static getLastSessionState(): any {
        let file = path.join(process.env.VSCODE_USER, "codemap.user", "codemap.state.json");
        if (fs.existsSync(file)) {
            let stateBack = Utils.read_all_text(file);
            try {
                return JSON.parse(stateBack);
            }
            catch (e) {
                return null;
            }
        }
        return null;
    }

    public static setLastSessionState(state: any): void {
        let file = path.join(process.env.VSCODE_USER, "codemap.user", "codemap.state.json");
        fs.writeFile(file, JSON.stringify(state), (err) => {
            if (err) {
                console.error(err);
            }
        });
    }
}

export class Utils {

    public static read_all_text(file: string): string {
        let text = fs.readFileSync(file, 'utf8');
        return text;
    }

    public static write_all_text(file: string, text: string): void {
        fs.writeFileSync(file, text, { encoding: 'utf8' });
    }

    public static read_all_lines(file: string): string[] {
        let text = fs.readFileSync(file, 'utf8');
        return text.split(/\r?\n/g);
    }

    public static write_all_lines(file: string, lines: string[]): void {
        fs.writeFileSync(file, lines.join('\n'), { encoding: 'utf8' });
    }

    public static editor_go_to_line(line: number): void {
        let editor = vscode.window.activeTextEditor;
        let range = editor.document.lineAt(line - 1).range;
        editor.selection = new vscode.Selection(range.start, range.end);
        editor.revealRange(range);
    }

    public static init(): void {

        // vscode:
        // Windows %appdata%\Code\User\settings.json
        // Mac $HOME/Library/Application Support/Code/User/settings.json
        // Linux $HOME/.config/Code/User/settings.json

        ///////////////////////////////////////
        let dataRoot = path.join(path.dirname(process.execPath), "data");
        let isPortable = (fs.existsSync(dataRoot) && fs.lstatSync(dataRoot).isDirectory());
        ///////////////////////////////////////

        if (isPortable) {
            process.env.VSCODE_USER = path.join(dataRoot, 'user-data', 'User', 'globalStorage');
        } else {
            if (os.platform() == 'win32')
                process.env.VSCODE_USER = path.join(process.env.APPDATA, 'Code', 'User');
            else if (os.platform() == 'darwin')
                process.env.VSCODE_USER = path.join(process.env.HOME, 'Library', 'Application Support', 'Code', 'User');
            else
                process.env.VSCODE_USER = path.join(process.env.HOME, '.config', 'Code', 'User');
        }
    }
}