import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Uri, commands } from "vscode";
import { Utils } from './utils';

export class mapper {

	public static generate(file: string): string[] {

		// def str_of(count, char):
		// 	text = ''
		// 	for i in range(count):
		// 		text = text + char
		// 	return text

		// # Pasrse
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
				let indent_level = line.length - code_line.length;

				function parse_as_class(keyword: string, line: string): any {
					if (code_line.startsWith(keyword + ' ') || code_line.startsWith('export ' + keyword + ' ')) {
						last_type = keyword;
						last_indent = indent_level
						if (code_line.startsWith('export ' + keyword + ' '))
							line = line.replace('export ' + keyword + ' ', keyword + ' ');

						let display_line = line.split('implements')[0];
						if (!display_line)
							display_line = line.split('{')[0];
						if (!display_line)
							display_line = line.trimEnd();

						// class CSScriptHoverProvider implements HoverProvider {     
						info = [line_num,
							keyword,
							display_line.split('(')[0].split(':')[0].trimEnd() + ' {}', // suffix brackets make it valid TS syntax
							indent_level]
						return info
					}
				}

				// miss C# here :)
				// info = parse_as_class('class', line) ??
				//        parse_as_class('interface', line) ?? 
				//        parse_as_class('whatever', line) 

				info = parse_as_class('class', line);

				if (!info)
					info = parse_as_class('interface', line);

				if (info) {
				}
				else if (code_line.startsWith('function ') || code_line.startsWith('export function ')) {
					if (last_type == 'function' && indent_level > last_indent)
						return; // private class functions
					last_type = 'function';
					last_indent = indent_level;
					info = [line_num,
						'function',
						line.split('(')[0].trimEnd() + '()',
						indent_level]
				}

				else if (code_line.startsWith('public ')) {
					last_type = 'public ';
					last_indent = indent_level;
					info = [line_num,
						'public ',
						line.replace('public ', '').split('(')[0].trimEnd() + '()',
						indent_level]
				}

				if (info) {
					let length = info[2].length;
					if (item_max_length < length)
						item_max_length = length;
					members.push(info)
				}
			});
		} catch (error) {
			// members.clear()
		}

		// format
		let map = '';
		let last_indent = 0;
		let last_type = '';

		members.forEach(item => {
			let line = item[0];
			let content_type = item[1];
			let content = item[2];
			let indent = item[3];
			let extra_line = '';

			if (indent == last_indent) {
				if (content_type != last_type)
					extra_line = '\n';
			}
			else if (content_type == 'class' || content_type == 'interface')
				extra_line = '\n';

			let prefix = ' '.repeat(indent);
			let lean_content = content.slice(indent);
			let suffix = ' '.repeat(item_max_length - content.length);
			lean_content = lean_content.replace('function ', '');
			map = map + extra_line + prefix + lean_content + suffix + ' :' + String(line) + '\n';

			last_indent = indent;
			last_type = content_type;
		});

		return map.trim().lines();
	}
}