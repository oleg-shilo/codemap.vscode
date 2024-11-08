"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class mapper {
    static read_all_lines(file) {
        let text = fs.readFileSync(file, 'utf8');
        return text.split(/\r?\n/g);
    }
    static generate(file) {
        let members = [];
        let line_num = 0;
        let item_max_length = 0;

        try {
            let styleSection = false;
            mapper
                .read_all_lines(file)
                .forEach(line => {
                    line = line.replace('\t', '    ');
                    line_num++;
                    let code_line = line.trim();
                    let info = null;
                    let indent_level = line.length - code_line.length;

                    function parse_as_tag(name, type, generateContext = false) {
                        if (!info && code_line.startsWith(`<${name}`)) {

                            let context = '';
                            if (generateContext) {
                                let match = code_line.match(/class=["']([^"']*)["']/);
                                if (match && match[1])
                                    context = ' > ' + match[1];
                            }

                            info = [line_num, name, name + context, indent_level, type];
                        }
                    }

                    parse_as_tag('html', '🚪');
                    parse_as_tag('head', '📝');
                    parse_as_tag('script type=', '📜');
                    parse_as_tag('style', '🖌️');
                    parse_as_tag('body', '📄');
                    {
                        parse_as_tag('div', '🔖', true);
                        parse_as_tag('span', '🔖', true);
                        parse_as_tag('h1', '🔖', true);
                        parse_as_tag('h2', '🔖', true);
                        parse_as_tag('button', '🔲', true);
                        parse_as_tag('table', '🎞️', true);
                        // sdd more if required
                    }

                    if (code_line === '<style>')
                        styleSection = true;
                    else if (code_line === '</style>')
                        styleSection = false;

                    // style section item
                    if (!info && styleSection && code_line.endsWith(' {')) {
                        info = [line_num, 'css', line.replace('{', '').trim(), indent_level, '🖍️'];
                    }

                    // script section item 
                    if (!info && code_line.startsWith('function ') || code_line.startsWith('export function ') || code_line.startsWith('async function ')) {
                        let name = line.split('(')[0].trimEnd().replace('function ', '').replace('export ', '').replace('async ', '');
                        info = [line_num, 'function', name + '()', indent_level, 'function'];
                    }

                    if (info) {
                        let length = info[2].length;
                        if (item_max_length < length)
                            item_max_length = length;
                        members.push(info);
                    }
                });
        }
        catch (error) {
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
            let suffix = ' '.repeat(item_max_length - content.length); // to ensure all lines are of same length; tree view renders it better this way 
            lean_content = lean_content.replace(' type=', '');

            // `item|${line_num}|level3`
            map = map + prefix + lean_content + suffix + '|' + String(line) + '|' + icon + '\n';
            last_indent = indent;
            last_type = content_type;
        });
        return map.trim().lines();
    }
}
exports.mapper = mapper;