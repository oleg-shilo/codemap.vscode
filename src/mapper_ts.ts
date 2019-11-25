import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Uri, commands } from "vscode";
import { Utils } from './utils';

export class mapper {

    public static generate(file: string): string[] {

        // # Parse
        let item_max_length = 0;
        let members = [];

        try {

            let lines = Utils.read_all_lines(file);

            let line_num = 0;
            let last_type = '';
            let last_indent = 0;

            lines.forEach(line => {

                line = line.replace('\t', '    ');
                line_num = line_num + 1;
                let code_line = line.trimStart();

                let info = null;
                let icon = '';
                let indent_level = line.length - code_line.length;

                function parse_as_class(keyword: string, line: string): any {
                    if (code_line.startsWith(keyword + ' ') || code_line.startsWith('export ' + keyword + ' ')) {
                        last_type = keyword;
                        last_indent = indent_level
                        if (code_line.startsWith('export ' + keyword + ' '))
                            line = line.replace('export ' + keyword + ' ', keyword + ' ');

                        let display_line = line
                            .split('implements')[0]
                            .split('extends')[0];

                        if (!display_line)
                            display_line = line.split('{')[0];
                        if (!display_line)
                            display_line = line.trimEnd();
                        if (display_line)
                            display_line = display_line.replace(/{+$/, "");

                        if (display_line.startsWith('class'))
                            icon = 'class';
                        else if (display_line.startsWith('interface'))
                            icon = 'interface';

                        // class CSScriptHoverProvider implements HoverProvider {     
                        info = [line_num,
                            keyword,
                            display_line.split('(')[0].split(':')[0].trimEnd(),
                            indent_level,
                            icon]
                        return info
                    }
                }

                function parse_as_class_member(accessor: string): void {
                    let accessor_name = accessor + ' ';
                    last_type = accessor_name;
                    last_indent = indent_level;
                    let content = line.replace(accessor_name, '').split('(')[0].trimEnd();
                    let icon = "property";

                    if (code_line.indexOf('(') != -1) {
                        icon = "function";
                        content += '()';
                    }

                    info = [line_num,
                        accessor_name,
                        content,
                        indent_level,
                        icon]
                }

                info = parse_as_class('class', line);

                let includePrivateMembers = false;


                if (!info)
                    info = parse_as_class('interface', line);

                if (info) {
                }

                else if (code_line.startsWith('function ') || code_line.startsWith('export function ') || code_line.startsWith('async function ')) {
                    if (last_type == 'function' && indent_level > last_indent) {
                        if (!includePrivateMembers)
                            return; // private class functions
                    }

                    last_type = 'function';
                    last_indent = indent_level;
                    info = [line_num,
                        'function',
                        line.split('(')[0].trimEnd() + '()',
                        indent_level,
                        'function']
                }

                else if (code_line.startsWith('public ')) {
                    parse_as_class_member('public');
                }

                else if (code_line.startsWith('private ') && includePrivateMembers) {
                    parse_as_class_member('private');
                }

                if (info) {
                    let length = info[2].length;
                    if (item_max_length < length)
                        item_max_length = length;
                    members.push(info)
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
            let line = item[0];
            let content_type = item[1]; // not in use yet
            let content = item[2];
            let indent = item[3];
            let icon = item[4];

            let prefix = ' '.repeat(indent);
            let lean_content = content.trimStart();
            let suffix = ' '.repeat(item_max_length - content.length);
            lean_content = lean_content.replace('function ', '')
                .replace('static ', '')
                .replace('export ', '');

            map = map + prefix + lean_content + suffix + '|' + String(line) + '|' + icon + '\n';

            last_indent = indent;
            last_type = content_type;
        });

        return map.trim().lines();
    }
}