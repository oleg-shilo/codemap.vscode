
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Uri, commands } from "vscode";

export class mapper {

	static read_all_lines(file: string): string[] {
		let text = fs.readFileSync(file, 'utf8');
		return text.split(/\r?\n/g);
	}

	static to_display_text(text: string): string {

		let indent_level = text.length - text.trimStart().length;

		return " ".repeat(indent_level) + text
			.replaceAll("static", "")
			.replaceAll("public", "")
			.replaceAll("private", "")
			.trimStart();
	}

	public static generate(file: string): string[] {

		let item_max_length = 0;
		let members = [];

		try {

			let line_num = 0;
			let image_index = 1;

			mapper
				.read_all_lines(file)
				.forEach(line => {

					line_num++;
					let code_line = line.trimStart();

					if (!code_line.startsWith("//")) {

						if (/.*class.*{/gm.test(line)) {
							let display_text = mapper.to_display_text(line.slice(0, -1));
							members.push(`${display_text}|${line_num}|class`);
						}

						if (/.*\(.*\).*{/gm.test(line)) {
							if (!code_line.startsWith("if") &&  	// if (...) {
								code_line.indexOf("new ") == -1 && 	// return new Messate() {
								code_line.indexOf(" = ") == -1 && 	// var sum = Count(); {
								!code_line.startsWith("for") &&		// for (int i=0; i!=len; ++i) {
								!code_line.startsWith("}")			// } catch (java.io.UnsupportedEncodingException uee) {
							) {
								let display_text = mapper.to_display_text(line.slice(0, -1));
								members.push(`${display_text}|${line_num}|function`);
							}
						}
					}
				});
		} catch (error) {
		}

		return members;
	}
}