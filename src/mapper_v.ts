/**
 * This file is a part of CodeMap distribution. 
 * It will be overwritten after the extension next update. Thus you may want to make an editable copy of
 * this file and add it as a custom dedicated mapper in the settings file.
*/
"use strict";

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


const DEBUG = 0;
const show_indent = 0;

export class mapper {

    static read_all_lines(file: string): string[] {
        let text = fs.readFileSync(file, 'utf8');
        return text.split(/\r?\n/g);
    }

    public static generate(file: string): string[] {

        let members = [];
        try {
            let line_num = 0;
            let prev_line = "";
            let prev_x2_line = "";

            const re_parsers = [
                // Module params
                {
                    "pattern": /(^\s*)module\s+(`?\w+)\s*#\s*\(/, // "module [`]name #("
                    "prefix": "module ",
                    "suffix": " #(",
                    "icon": "class"
                },
                {
                    "pattern": /(^\s*)module\s+(`?\w+)(?:\s*\/\/\.*)?$/, // "module [`]name \n #("
                    "prefix": "module ",
                    "suffix": " #(",
                    "icon": "class",
                    "twoLinePattern": /^\s*#\s*\(/
                },
                {
                    "pattern": /(^\s*)module\s+(`?\w+)\s*#(?:\s*\/\/\.*)?$/, // "module [`]name # \n ("
                    "prefix": "module ",
                    "suffix": " #(",
                    "icon": "class",
                    "twoLinePattern": /^\s*\(/
                },
                // Module
                {
                    "pattern": /(^\s*)module\s+(`?\w+)\s*\(/, // "module [`]name  ("
                    "prefix": "module ",
                    "suffix": " (",
                    "icon": "class"
                },
                {
                    "pattern": /(^\s*)module\s+(`?\w+)(?:\s*\/\/\.*)?$/, // "module [`]name \n ("
                    "prefix": "module ",
                    "suffix": " (",
                    "icon": "class",
                    "twoLinePattern": /^\s*\(/
                },
                // Instance params
                {
                    "pattern": /(^\s*)(`?\w+)\s*#\s*\(/, // "[`]instance #("
                    "suffix": " #",
                    "icon": "property"
                },
                {
                    "pattern": /(^\s*)(`?\w+)(?:\s*\/\/\.*)?$/, // "[`]instance \n #("
                    "suffix": " #",
                    "icon": "property",
                    "twoLinePattern": /^\s*#\s*\(/
                },
                {
                    "pattern": /(^\s*)(`?\w+)\s*#(?:\s*\/\/\.*)?$/, // "[`]instance # \n ("
                    "suffix": " #",
                    "icon": "property",
                    "twoLinePattern": /^\s*\(/
                },
                {
                    "pattern": /(^\s*)(`\w+)\(.*?\)\s*#\s*\(/, // "`MACRO_NAME(`PACKAGE_NAME, `VER)   #("
                    "suffix": " #",
                    "icon": "property"
                },
                {
                    "pattern": /(^\s*)(`\w+)\(.*?\)(?:\s*\/\/\.*)?$/, // "`MACRO_NAME(`PACKAGE_NAME, `VER) \n  #("
                    "suffix": " #",
                    "icon": "property",
                    "twoLinePattern": /^\s*#\s*\(/
                },
                {
                    "pattern": /(^\s*)(`\w+)\(.*?\)\s*#(?:\s*\/\/\.*)?$/, // "`MACRO_NAME(`PACKAGE_NAME, `VER)  # \n ("
                    "suffix": " #",
                    "icon": "property",
                    "twoLinePattern": /^\s*\(/
                },
                {
                    "pattern": /(^\s*)\(\*.+?\*\)\s*(`?\w+)\s*#\s*\(/, // "(* DONT_TOUCH = "yes" *) [`]instance #("
                    "clear": "\(\*.+?\*\)\s*",
                    "suffix": " #",
                    "icon": "property"
                },
                {
                    "pattern": /(^\s*)\(\*.+?\*\)\s*(`?\w+)(?:\s*\/\/\.*)?$/, // "(* DONT_TOUCH = "yes" *) [`]instance \n #("
                    "clear": "\(\*.+?\*\)\s*",
                    "suffix": " #",
                    "icon": "property",
                    "twoLinePattern": /^\s*#\s*\(/
                },
                {
                    "pattern": /(^\s*)\(\*.+?\*\)\s*(`?\w+)\s*#(?:\s*\/\/\.*)?$/, // "(* DONT_TOUCH = "yes" *) [`]instance # \n ("
                    "clear": "\(\*.+?\*\)\s*",
                    "suffix": " #",
                    "icon": "property",
                    "twoLinePattern": /^\s*\(/
                },
                // Instance
                {
                    "pattern": /(^\s*)\)\s*(`?\w+)\s*\(/, // ") [`]inst_name ("
                    "icon": "level1"
                },
                {
                    "pattern": /(^\s*)\)\s*(`?\w+)(?:\s*\/\/\.*)?$/, // ") [`]inst_name \n ("
                    "icon": "level1",
                    "twoLinePattern": /^\s*\(/
                },
                {
                    "pattern": /(^\s*)(`?\w+)(?:\s*\/\/\.*)?$/, // ") \n [`]inst_name \n ("
                    "icon": "level1",
                    "threeLinePattern": {
                        "prev": /\)$/,
                        "next": /^\s*\(/
                    }
                },
                {
                    "pattern": /(^\s*)\)\s*(`?\w+\[.*?\])\s*\(/, // ") [`]inst_name[3:0] ("
                    "icon": "level1"
                },
                {
                    "pattern": /(^\s*)\)\s*(`?\w+\[.*?\])(?:\s*\/\/\.*)?$/, // ") [`]inst_name[3:0] \n ("
                    "icon": "level1",
                    "twoLinePattern": /^\s*\(/
                },
                {
                    "pattern": /(^\s*)\w+\s+(\w+)\s*\(\)/, // undefined_parameters undefined_parameters()
                    "icon": "level1"
                },
                {
                    "pattern": /(^\s*)`?\w+\s+(\w+)\s*\(\s*$/, // "[`]submodule inst_name ("
                    "icon": "level1"
                },
                {
                    "pattern": /(^\s*)`?(?!ifdef)\w+\s+(\w+)(?:\s*\/\/\.*)?$/, // "[`]submodule inst_name \n ("
                    "icon": "level1",
                    "twoLinePattern": /^\s*\(/
                },
                {
                    "pattern": /(^\s*)\(\*.+?\*\)\s*`?(?!ifdef)\w+\s+(\w+)\s*\(\s*$/, // "(* DONT_TOUCH = "yes" *) [`]submodule inst_name ("
                    "icon": "level1"
                },
                {
                    "pattern": /(^\s*)\(\*.+?\*\)\s*`?(?!ifdef)\w+\s+(\w+)(?:\s*\/\/\.*)?$/, // "(* DONT_TOUCH = "yes" *) [`]submodule inst_name \n ("
                    "icon": "level1",
                    "twoLinePattern": /^\s*\(/
                },
                {
                    "pattern": /(^\s*)`?(?!ifdef)\w+\s+(\w+\[.*?\])\s*\(\s*$/, // "[`]submodule inst_name[3:0] ("
                    "icon": "level1"
                },
                {
                    "pattern": /(^\s*)`?(?!ifdef)\w+\s+(\w+\[.*?\])(?:\s*\/\/\.*)?$/, // "[`]submodule inst_name[3:0] \n ("
                    "icon": "level1",
                    "twoLinePattern": /^\s*\(/
                },
                // Others
                {
                    "pattern": /(^\s*).*?\b(S_\w+\s*=.*)[,;]/, // "S_... = ..."
                    "clear": " ",
                    "prefix": "State: ",
                    "icon": "function"
                },
                {
                    "pattern": /(^\s*)task\s+(.*)/, // "task ..."
                    "clear": ";",
                    "icon": "function"
                },
                {
                    "pattern": /(^\s*)(initial.*)/, // "initial ..."
                    "clear": "begin",
                    "icon": "function"
                },
                {
                    "pattern": /(^\s*)\/\/\s*([iI][nN][iI][tT][iI][aA][lL])\s*?/ // "// initial" or "// INITIAL"
                },
                {
                    "pattern": /(^\s*)\/\/\s*([sS][tT][iI][mM][uU][lL][iI])\s*?/ // "// stimuli" or "// STIMULI"
                },
                {
                    "pattern": /(^\s*)\/\/\s*([dD][eE][bB][uU][gG])\s*?/ // "// debug" or "// DEBUG"
                },
                {
                    "pattern": /(^\s*)\/\/\s*FSM\s+(\w+)/, // "// FSM fsm_name"
                    "prefix": "// FSM "
                },
                {
                    "pattern": /(^\s*)(localparam.*?);/, // "localparam ..."
                    "prefix": "⚙️ "
                },
                {
                    "pattern": /(^\s*)(function.*?);/, // "function ..."
                    "icon": "function"
                },
                {
                    "pattern": /(^\s*)(always.*)/, // "always ..."
                    "clear": "begin",
                    "icon": "function"
                },
                {
                    "pattern": /(^\s*)(case.*)/, // "case ..."
                    "icon": "function"
                },
                {
                    "pattern": /(\s*)(begin\s*:.*)/, // "begin :"
                    "clear": "begin|:| ",
                    "prefix": "=== ",
                    "suffix": " ==="
                },
                {
                    "pattern": /(\s*)(end\s*:)/, // "end :"
                    "clear": ":| ",
                    "prefix": "= ",
                    "suffix": " ="
                },
                {
                    "pattern": /(^\s*)(`?(?!end)\w+)\s*:/, // "case_name :"
                    "suffix": " :"
                },
                {
                    "pattern": /(^\s*)(default)\s*:/, // "default :"
                    "suffix": " :"
                },
                {
                    "pattern": /(^\s*)(\d*'\w.+?)\s*:/, // "2'b10 :"
                    "suffix": " :"
                },
                {
                    "pattern": /(^\s*)(generate.*)/, // "generate..."
                    "clear": "begin"
                },
                {
                    "pattern": /(^\s*)(endgenerate.*)/ // "endgenerate..."
                }
            ];

            mapper
                .read_all_lines(file)
                .forEach(line => {
                    line_num++;
                    line = line.replace(/\t/g, '  ');
                    // proc
                    let isFound = false;
                    let result_line = "";
                    let result_line_num = 0;
                    let result_re_parser: any = {};


                    for (const re_parser of re_parsers) {
                        if ("threeLinePattern" in re_parser) {
                            if (re_parser.threeLinePattern.next.test(line)) {
                                if (re_parser.pattern.test(prev_line)) {
                                    if (re_parser.threeLinePattern.prev.test(prev_x2_line)) {
                                        isFound = true;
                                        result_line = prev_line;
                                        result_line_num = line_num - 1;
                                        result_re_parser = re_parser;
                                        break;
                                    }
                                }
                            }
                        } else if ("twoLinePattern" in re_parser) {
                            if (re_parser.twoLinePattern.test(line)) {
                                if (re_parser.pattern.test(prev_line)) {
                                    isFound = true;
                                    result_line = prev_line;
                                    result_line_num = line_num - 1;
                                    result_re_parser = re_parser;
                                    break;
                                }
                            }
                        } else if (re_parser.pattern.test(line)) {
                            isFound = true;
                            result_line = line;
                            result_line_num = line_num;
                            result_re_parser = re_parser;
                            break;
                        }
                    }

                    if (isFound) {
                        let result = result_line.match(result_re_parser.pattern);
                        let result_indent = "";
                        let result_text = "";
                        let result_icon = "none";

                        if (result.length == 2) {
                            result_text = result[1];
                        } else {
                            result_indent = result[1];
                            result_text = result[2];
                        }

                        if ("clear" in result_re_parser) {
                            const clears = result_re_parser.clear.split("|");
                            clears.forEach(clear => {
                                result_text = result_text.replace(clear, '');
                            });
                        }

                        if ("prefix" in result_re_parser) {
                            result_text = result_re_parser.prefix + result_text;
                        }

                        if ("suffix" in result_re_parser) {
                            result_text = result_text + result_re_parser.suffix;
                        }

                        if ("icon" in result_re_parser) {
                            result_icon = result_re_parser.icon;
                        }

                        if (DEBUG) {
                            if ("threeLinePattern" in result_re_parser) {
                                members.push(`✍🏻 DEBUG three-line pattern:|${result_line_num}|none`);
                                members.push(`✍🏻 #1: "${result_re_parser.threeLinePattern.prev}"|${result_line_num}|none`);
                                members.push(`✍🏻 #2: "${result_re_parser.pattern}"|${result_line_num}|none`);
                                members.push(`✍🏻 #3: "${result_re_parser.threeLinePattern.next}"|${result_line_num}|none`);
                            } else if ("twoLinePattern" in result_re_parser) {
                                members.push(`✍🏻 DEBUG two-line pattern:|${result_line_num}|none`);
                                members.push(`✍🏻 #1: "${result_re_parser.pattern}"|${result_line_num}|none`);
                                members.push(`✍🏻 #2: "${result_re_parser.twoLinePattern}"|${result_line_num}|none`);
                            } else {
                                members.push(`✍🏻 DEBUG "${result_re_parser.pattern}"|${result_line_num}|none`);
                            }
                        }

                        if (show_indent) {
                            members.push(`${result_indent}${result_text}|${result_line_num}|${result_icon}`);
                        } else {
                            members.push(`${result_text}|${result_line_num}|${result_icon}`);
                        }
                    }

                    prev_x2_line = prev_line;
                    prev_line = line;
                });
        }
        catch (error) {
        }
        return members;
    }
}