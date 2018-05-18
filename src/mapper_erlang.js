"use strict";
/**
 * @name            mapper_erlang
 * @author          Andrea Benini (andrea benini  at  google public mail)
 * @description     Simple and barebone erlang mapper for Visual Studio Code CodeMap plugin,
 * 
 * @example         "codemap.erl": "/path/where/this/mapper/is/mapper_erlang.js"
 * @see             History
 *                  v0.1 (2018/05)
 *                      - This mapper has started as a small test to get functions and defines set and
 *                        deal with Erlang files, syntax is pretty simple and mostly based on regexp.
 *                        Nothing fancy and works, contribute to expand it and let me know how it goes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");

class mapper {

    static read_all_lines(file) {
        let text = fs.readFileSync(file, 'utf8');
        return text.split(/\r?\n/g);
    }

    static generate(file) {
        let members = [];
        try {
            let line_num = 0;
            mapper
                .read_all_lines(file)
                .forEach(line => {
                    // First line, file name
                    if (line_num==0) {
                        let basename = file.replace(/\\/g, '/').replace(/.*\//, '').replace(/(.+)(.erl)/, '$1');
                        members.push(`${basename}|1|document`);
                    }
                    line_num++;
                    line = line.trim();
                    // Define               "-define(SOMETHING, ..."
                    let Define = line.match(/-define\s*\(\s*([a-zA-Z]+)(.+)/);
                    if (Define!=null && Define[1]!=null && Define[1]!='') {
                        members.push(`    ${Define[1]}()|${line_num}|property`);
                    }
                    // Function               [a-z][w+](.+) ->
                    let Function = line.match(/^\s*([a-z][a-zA-Z0-9]+)\s*(\(.+\))\s*(->)\s*(.*)$/);
                    if (Function!=null && Function[1]!=null && Function[1]!='' && Function[3] == '->') {
                        members.push(`${Function[1]}${Function[2]}|${line_num}|function`);
                    }
            });
        } catch (error) {
        }
        return members;
    }
}
exports.mapper = mapper;
