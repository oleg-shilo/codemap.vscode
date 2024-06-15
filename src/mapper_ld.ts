/**
 * This file is a part of CodeMap distribution. 
 * It will be overwritten after the extension next update. Thus you may want to make an editable copy of
 * this file and add it as a custom dedicated mapper in the settings file.
*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import * as fs from "fs";

class mapper {

    static read_all_lines(file) {
        let text = fs.readFileSync(file, 'utf8');
        return text.split(/\r?\n/g);
    }

    static generate(file) {
        let members = [];
        try {
            let line_num = 0;
            let prev_line = "";
            mapper
                .read_all_lines(file)
                .forEach(line => {
                    line_num++;
                    // line = line.trimStart();
                    if (line.startsWith("// SECTION:"))
                        members.push(`${line}|${line_num}|level1`);
                    else if (line.startsWith("{"))
                        members.push(`${prev_line}|${line_num - 1}|function`);
                    prev_line = line;
                });
        }
        catch (error) {
        }
        return members;
    }
}
exports.mapper = mapper;