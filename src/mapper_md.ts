import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class mapper {

	static read_all_lines(file: string): string[] {
		let text = fs.readFileSync(file, 'utf8');
		return text.split(/\r?\n/g);
	}

	public static generate(file: string): string[] {

		"".match(/.* \(.*\) {/g)
		let members = [];

		try {

			let line_num = 0;
			let image_index = 1;

			mapper
				.read_all_lines(file)
				.forEach(line => {

					line_num++;
					line = line.trimStart();

					if (line.startsWith("### "))
						members.push(`${line.substr(4)}|${line_num}|level3`);
					else if (line.startsWith("## "))
						members.push(`${line.substr(3)}|${line_num}|level2`);
					else if (line.startsWith("# "))
						members.push(`${line.substr(2)}|${line_num}|level1`);
					else if (line.startsWith("![image]"))
						members.push(`<image ${image_index++}>|${line_num}|none`);

				});
		} catch (error) {
		}
		return members;
	}
}