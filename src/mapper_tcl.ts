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

            const re_proc = /^(\s*)proc\s+(.+?)(?:\s*{\s*)$/;
            const re_class = /^(\s*)(?:(?:::)?itcl::)?class\s+([\w:]+)/;
            const re_variable = /^(\s*)(?:(?:public|private|protected)?\s+)?variable\s+(\w+)/;
            const re_constructor = /^(\s*)constructor\s+(.+?)(?:\s*{\s*)$/;
            const re_destructor = /^(\s*)destructor/;
            const re_method = /^(\s*)(?:(?:public|private|protected)?\s+)?method\s+(\w+.+)(?:\s*{\s*)$/;
            const re_namespace = /^(\s*)(?:namespace\s+eval)\s+((?:::)?\w+)/;

            mapper
                .read_all_lines(file)
                .forEach(line => {
                    line_num++;
                    line = line.replace(/\t/g, '    ');
                    // proc
                    if (re_proc.test(line)) {
                        let result = line.match(re_proc);
                        members.push(`${result[1]}${result[2]}|${line_num}|function`);
                        // itcl::class
                    } else if (re_class.test(line)) {
                        let result = line.match(re_class);
                        members.push(`${result[1]}${result[2]}|${line_num}|class`);
                        // variable
                    } else if (re_variable.test(line)) {
                        let result = line.match(re_variable);
                        members.push(`${result[1]}${result[2]}|${line_num}|property`);
                        // method
                    } else if (re_method.test(line)) {
                        let result = line.match(re_method);
                        members.push(`${result[1]}${result[2]}|${line_num}|function`);
                        // constructor
                    } else if (re_constructor.test(line)) {
                        let result = line.match(re_constructor);
                        members.push(`${result[1]}constructor ${result[2]}|${line_num}|function`);
                        // destructor
                    } else if (re_destructor.test(line)) {
                        let result = line.match(re_destructor);
                        members.push(`${result[1]}destructor|${line_num}|function`);
                        // namespace
                    } else if (re_namespace.test(line)) {
                        let result = line.match(re_namespace);
                        members.push(`${result[1]}${result[2]}|${line_num}|document`);
                    }
                });
        }
        catch (error) {
        }

        return members
    }
}
exports.mapper = mapper;
