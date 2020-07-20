import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Uri, commands } from "vscode";



declare global {
    interface String {
        // splitBy(separator: string): string;
        trimStart(): string;
        trimEnd(): string;
        replaceAll(search: string, replacement: string): string;
        lines(limit?: number): string[];
    }

    // interface Array<T> {
    //     where<T>(filter: (T) => boolean): Array<T>;
    //     any<T>(filter: (T) => boolean): boolean;
    //     select<U>(convert: (T) => U): Array<U>;
    //     cast<U>(): Array<U>;
    //     first<T>(filter?: (T) => boolean): T;
    //     firstOrDefault<T>(filter?: (T) => boolean): T;
    // }
}

// String.prototype.splitBy = function (separator: string) {
//     return this.replace(/ +$/, "");
// }

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

    public textMode = true;
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
        else if (name == 'json') return this.json;
        else if (name == 'textModeLevelPrefix') return this.textModeLevelPrefix;
        else if (name == 'textMode') return this.textMode;
        else if (name == 'textModeExpanded') return this.textModeExpanded;
        else if (name == 'maxNestingLevel') return 3;
        else return null;
    }
}

export class Utils {

    public static read_all_lines(file: string): string[] {
        let text = fs.readFileSync(file, 'utf8');
        return text.split(/\r?\n/g);
    }

    public static write_all_lines(file: string, lines: string[]): void {
        fs.writeFileSync(file, lines.join('\n'), { encoding: 'utf8' });
    }

    public static init(): void {

        // vscode:
        // Windows %appdata%\Code\User\settings.json
        // Mac $HOME/Library/Application Support/Code/User/settings.json
        // Linux $HOME/.config/Code/User/settings.json

        if (os.platform() == 'win32') {
            process.env.VSCODE_USER = path.join(process.env.APPDATA, 'Code', 'User');
        }
        else if (os.platform() == 'darwin') {
            process.env.VSCODE_USER = path.join(process.env.HOME, 'Library', 'Application Support', 'Code', 'User');
        }
        else {
            process.env.VSCODE_USER = path.join(process.env.HOME, '.config', 'Code', 'User');
        }
    }
}