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