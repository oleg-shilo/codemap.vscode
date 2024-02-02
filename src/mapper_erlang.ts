"use strict";
/**
 * ------------------------------------------ 
 * This file is a part of CodeMap distribution. 
 * It will be overwritten after the extension next update. Thus you may want to make an editable copy of
 * this file and add it as a custom dedicated mapper in the settings file.
 * ------------------------------------------ 
 * @name            mapper_erlang
 * @author          Andrea Benini (andrea benini  at  google public mail)
 * @description     Simple and barebone erlang mapper for Visual Studio Code CodeMap plugin,
 * 
 * @example         Add these to your User|Workspace settings:
 *                      "codemap.erl": "/path/where/this/mapper/is/mapper_erlang.ts",
 *                      "codemap.hrl": "/opt/VisualStudioCode/codemap/mapper_erlang.ts"
 * @see             History
 *                  v0.2 (2018/05)
 *                      - File renamed to mapper_erlang.ts (typescript), syntax for .erl and .hrl files
 *                      - icon changes and few minor fixes on functions and defines regexps
 *                      - Added "-include()"   statements syntax
 *                      - Added "-behaviour()" statements syntax
 *                      - FIX: Function arguments in many regexps: functions defines, includes, char '|'
 *                        is reserved in CodeMap but a possible char in between Erlang function params
 *                  v0.1 (2018/05)
 *                      - This mapper has started as a small test to get functions and defines set and
 *                        deal with Erlang files, syntax is pretty simple and mostly based on regexps.
 *                        Nothing fancy but works, contribute to expand it and let me know how it goes.
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
                    if (line_num == 0) {
                        let basename = file.replace(/\\/g, '/').replace(/.*\//, '').replace(/(.+)(.erl)/, '$1');
                        members.push(`${basename}|1|class`);
                    }
                    line_num++;
                    line = line.trim();
                    // Include              '-include("SOMETHING")...'
                    let Include = line.match(/-include\s*\("\s*(.+)"(.+)/);
                    if (Include != null && Include[1] != null && Include[1] != '') {
                        members.push(`    ${Include[1]}|${line_num}|document`);
                    }
                    // Behaviour            '-behaviour(SOMETHING)...'
                    let Behaviour = line.match(/-behaviour\s*\(\s*(.+)\s*\)(.+)/);
                    if (Behaviour != null && Behaviour[1] != null && Behaviour[1] != '') {
                        members.push(`    ${Behaviour[1]}|${line_num}|interface`);
                    }
                    // Define               "-define(SOMETHING, ..."
                    let Define = line.match(/^-define\s*\(\s*([\w0-9]+)(.+)/);
                    if (Define != null && Define[1] != null && Define[1] != '') {
                        members.push(`    ${Define[1]}|${line_num}|property`);
                    }
                    // Function               [a-z][a-zA-Z0-9_](.+) ->
                    let Function = line.match(/^\s*([a-z][a-zA-Z0-9_]+)\s*(\(.*\))\s*(->)\s*(.*)$/);
                    if (Function != null && Function[1] != null && Function[1] != '' && Function[3] == '->') {
                        Function[2] = Function[2].replace(/\|/g, String.fromCharCode(0x01C0));  // Dirty hack but "|" is reserved
                        members.push(`${Function[1]}${Function[2]}|${line_num}|function`);
                    }
                });
        } catch (error) {
        }
        return members;
    }
}
exports.mapper = mapper;
