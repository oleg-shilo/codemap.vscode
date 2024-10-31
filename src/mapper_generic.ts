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
        let members = [];

        try {

            mappings.forEach(item => item.regex = new RegExp(item.pattern, 'g'));

            let lines: string[];

            let text = vscode.window.activeTextEditor.document.getText();
            lines = text.split(/\r?\n/g);

            let line_num = 0;

            lines.forEach(line => {

                line_num = line_num + 1;
                line = line.replace('\t', '    ').replace('|', '%pipe%');

                if (line != '') {

                    let code_line = line.trimStart();
                    let level_indent = line.length - code_line.length;

                    for (let item of mappings) {

                        let m = line.match(item.regex);

                        if (m) {
                            let level_hierarchy = 0
                            if (item.levelIndent)
                                level_hierarchy = item.levelIndent;

                            let match = m[0];

                            if (item.clear)
                                item.clear
                                    .split('|')
                                    .forEach(text => {
                                        try {
                                            // match = match.replaceAll(text, ''); // fails to treat arguments as regex :o(
                                            match = match.replace(new RegExp(text, 'g'), '');
                                        }
                                        catch (error) {
                                            console.log(error);
                                        }
                                    });

                            if (item.suffix)
                                match += item.suffix;
                            if (item.prefix)
                                match = item.prefix + match;
                            // TODO: We should do the processing here instead.
                            // Collecting and processing may lead to
                            // misinterpretation of hierarch, hence
                            // when we go out of a function and enter
                            // another indentation and have a mapping,
                            // this mapping will be nested under functions
                            // even it is not inside the function
                            //
                            members.push([line_num, item.role, match, level_indent, item.icon, level_hierarchy]);

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
                let hierarchy = item[5];
                let extra_line = '';

                if (indent == last_indent && content_type != last_type)
                    extra_line = '\n';

                let prefix = ' '.repeat(indent);
                let lean_content = content.trimStart();

                map = map + extra_line + prefix + lean_content + '|' +
                    String(line) + '|' + icon + '|'+ String(hierarchy) + '\n';

                last_indent = indent;
                last_type = content_type;

            } catch (error) {
                console.log(''); // just a breakpoint placeholder
            }
        });

        return map.trim().lines();
    }
}