import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Uri, commands } from "vscode";
import { Config, config_defaults, Utils } from './utils';

export interface SyntaxMapping {
    pattern: string;
    clear: string;
    suffix: string;
    prefix: string;
    regex: RegExp;
    levelIndent: number;
    role: string;
    icon: string;
}

export class mapper {

    private static compareByLevelAndTitle(n1: any, n2: any): number {
        let level_indent1 = n1[3];
        let level_indent2 = n2[3];
        let title1 = n1[2];
        let title2 = n2[2];

        if (level_indent1 > level_indent2)
            return 1;

        if (level_indent1 < level_indent2)
            return -1;


        if (title1 > title2)
            return 1;

        if (title1 < title2)
            return -1;

        return 0;
    }

    public static generate(file: string, mappings: SyntaxMapping[]): string[] {

        // # Parse
        let item_max_length = 0;
        let members = [];

        try {

            mappings.forEach(item => item.regex = new RegExp(item.pattern, 'g'));

            let lines: string[];

            let text = vscode.window.activeTextEditor.document.getText();
            lines = text.split(/\r?\n/g);

            let line_num = 0;
            let last_type = '';
            let last_indent = 0;

            lines.forEach(line => {

                line_num = line_num + 1;
                line = line.replace('\t', '    ');

                if (line != '') {

                    let code_line = line.trimStart();

                    for (let item of mappings) {

                        let m = line.match(item.regex);

                        if (m) {

                            let level_indent = line.length - code_line.length;
                            if (item.levelIndent)
                                level_indent = item.levelIndent;

                            let match = m[0];

                            if (item.clear)
                                item.clear
                                    .split('|')
                                    .forEach(text => {
                                        try {
                                            match = match.replaceAll(text, '');
                                        }
                                        catch (error) {
                                            console.log(error);
                                        }
                                    });

                            if (item.suffix)
                                match += item.suffix;
                            if (item.prefix)
                                match = item.prefix + match;

                            members.push([line_num, item.role, match, level_indent, item.icon]);
                            break;
                        }
                    }
                }
            });
        } catch (error) {
            members = [];
        }

        // format
        let map = '';
        let last_indent = 0;
        let last_type = '';

        members.forEach(item => {
            try {
                let line = item[0];
                let content_type = item[1];
                let content = item[2];
                let indent = item[3];
                let icon = item[4];
                let extra_line = '';

                if (indent == last_indent && content_type != last_type)
                    extra_line = '\n';

                let prefix = ' '.repeat(indent);
                let lean_content = content.trimStart();

                map = map + extra_line + prefix + lean_content + '|' + String(line) + '|' + icon + '\n';

                last_indent = indent;
                last_type = content_type;

            } catch (error) {
                console.log('');
            }
        });

        return map.trim().lines();
    }
}