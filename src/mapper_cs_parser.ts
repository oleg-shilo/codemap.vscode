
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Uri, commands } from "vscode";

// TODO: cleanup and refactoring

export class mapper {

	static read_all_lines(file: string): string[] {
		let text = fs.readFileSync(file, 'utf8');
		return text.split(/\r?\n/g);
	}

	static to_display_text(text: string): string {

		let indent_level = text.length - text.trimStart().length;

		let parts = text.split('(', 2)

		// class
		if (parts.length < 2)
			return " ".repeat(indent_level) + text
				.replaceAll("static", "")
				.replaceAll("partial", "")
				.replaceAll("public", "")
				.replaceAll("internal", "")
				.replaceAll("private", "")
				.trimStart()

		// method
		let leftPart = parts[0].split(' ');
		let numOfParams = parts[1].split(',').length;

		let display_text = leftPart[leftPart.length - 1];

		return " ".repeat(indent_level) + display_text
			.replaceAll("static", "")
			.replaceAll("public", "")
			.replaceAll("internal", "")
			.replaceAll("private", "")
			.trimStart()
			+ `(${", ".repeat(numOfParams).trimEnd()})`;
	}

	public static generate(file: string): string[] {

		let item_max_length = 0;
		let members = [];

		try {

			let line_num = 0;
			let image_index = 1;
			let firstIndent = -1;


			let classRegex = /.*(class|interface).*/gm;
			let methodRegex = /.*\(.*\)s*/gm;

			mapper
				.read_all_lines(file)
				.forEach(line => {

					line_num++;
					let code_line = line.trim();

					if (!code_line.startsWith("//")
						// && !code_line.endsWith(";")
						&& !code_line.endsWith("]")
					) {

						if (classRegex.test(line)) {
							let display_text = mapper.to_display_text(line);

							if (firstIndent == -1)
								firstIndent = display_text.length - display_text.trimStart().length;
							if (firstIndent != 0)
								display_text = display_text.substring(firstIndent);

							members.push(`${display_text}|${line_num}|class`);
						}

						if (methodRegex.test(code_line)) {
							if (!code_line.startsWith("if") &&  	// if (...) {
								code_line.indexOf("else if ") == -1 && 	// else if (item is File)
								code_line.indexOf("new ") == -1 && 	// return new Message() 
								code_line.indexOf(" (") == -1 && 	// The MIT License (MIT) 
								!code_line.startsWith(".") &&            // .Select(x=>x)
								code_line.indexOf("=>") == -1 &&        // .Select(x=>x)
								code_line.indexOf(" = ") == -1 && 	// var sum = Count(); 
								code_line.indexOf("while") == -1 &&     // while (result != null)
								!code_line.startsWith("for") &&		// for (int i=0; i!=len; ++i) 
								!code_line.endsWith(";") &&		// Count();  
								code_line.endsWith(")")			// int Count()  
							) {
								let display_text = mapper.to_display_text(line);
								if (display_text.indexOf(".") == -1) { // dotnet_root.Split(Path.DirectorySeparatorChar)
									if (firstIndent == -1)
										firstIndent = display_text.length - display_text.trimStart().length;
									if (firstIndent != 0)
										display_text = display_text.substring(firstIndent);

									members.push(`${display_text}|${line_num}|function`);
								}
							}
						}
					}
				});
		} catch (error) {
		}

		return members;
	}
}
