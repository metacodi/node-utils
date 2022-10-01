"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Terminal = void 0;
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
class Terminal {
    static run(command, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const verbose = options.verbose === undefined ? Terminal.verboseEnabled : !!options.verbose;
            const stdio = options.stdio || (verbose ? 'pipe' : 'inherit');
            const color = options.titleColor;
            return new Promise((resolve, reject) => {
                if (verbose) {
                    Terminal.renderChalk(command, { color, bold: true });
                    const parts = command.split(' ');
                    const args = parts.slice(1);
                    const proc = (0, child_process_1.spawn)(parts[0], args, { stdio, shell: true });
                    let stdout = '';
                    if (proc.stdout) {
                        proc.stdout.on('data', (data) => { stdout += data.toString(); process.stdout.write(chalk_1.default.green(data.toString())); });
                    }
                    let stderr = '';
                    if (proc.stderr) {
                        proc.stderr.on('data', (data) => { stderr += data.toString(); process.stdout.write(chalk_1.default.yellow(data.toString())); });
                    }
                    proc.once('exit', (code, signal) => {
                        if (!!code && (stdio === 'inherit' || !!stderr)) {
                            reject(stderr);
                        }
                        else {
                            resolve(stdout);
                        }
                    });
                }
                else {
                    (0, child_process_1.exec)(command, (error, stdout, stderr) => {
                        if (!!error && !!error.code && !!stderr) {
                            reject(stderr);
                        }
                        else {
                            resolve(stdout);
                        }
                    });
                }
            });
        });
    }
    static log(message, ...data) {
        const indent = '  '.repeat(Terminal.indent);
        Terminal.clearLine();
        if (data === undefined) {
            console.log(indent + message);
        }
        else {
            console.log(indent + message, ...data);
        }
    }
    static logInline(text) {
        Terminal.clearLine();
        process.stdout.write(`${text}`);
    }
    static verbose(message, data) {
        if (Terminal.verboseEnabled) {
            Terminal.clearLine();
            Terminal.log(message, data);
        }
    }
    static blob(content) {
        if (Terminal.verboseEnabled) {
            Terminal.clearLine();
            Terminal.line();
            Terminal.log(content);
            Terminal.line();
        }
    }
    static warning(message) {
        Terminal.clearLine();
        Terminal.log(chalk_1.default.bold.yellow('WARN: ') + chalk_1.default.yellow(message) + '\n');
    }
    static error(error, exit = true) {
        Terminal.clearLine();
        const message = typeof error === 'string' ? error : error.error || error.message || 'Error desconegut';
        Terminal.log(chalk_1.default.bold.red('ERROR: ') + chalk_1.default.red(message));
        if (exit) {
            Terminal.line();
            process.exit(1);
        }
    }
    static file(fileName, relativeTo) {
        const i = relativeTo ? Terminal.relative(fileName, relativeTo) : fileName.split('\\').join('/').lastIndexOf('/');
        if (i > 0) {
            const base = fileName.substring(0, i);
            const name = fileName.substring(i);
            return chalk_1.default.green(base) + chalk_1.default.bold.green(name);
        }
        else {
            return chalk_1.default.green(fileName);
        }
    }
    static relative(from, to) {
        let i = 0;
        while (i < Math.min(from.length, to.length)) {
            if (from.charAt(i) !== to.charAt(i)) {
                return i - 1;
            }
            i++;
        }
        return i - 1;
    }
    static success(message, check = '√') {
        Terminal.clearLine();
        Terminal.log(`${chalk_1.default.bold.green(check)} ${message}`);
    }
    static fail(error, check = 'x') {
        Terminal.clearLine();
        Terminal.log(`${chalk_1.default.bold.red(check)} ${error}`);
    }
    static clearLine() {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
    }
    static line(options) {
        if (!options) {
            options = {};
        }
        if (options.bold === undefined) {
            options.bold = false;
        }
        const color = options.color;
        const line = `--------------------------------------------------------------------------------`;
        Terminal.log(Terminal.colorize(color, options.bold ? chalk_1.default.bold(line) : line));
    }
    static double(options) {
        if (!options) {
            options = {};
        }
        if (options.bold === undefined) {
            options.bold = false;
        }
        const color = options.color;
        const line = `================================================================================`;
        Terminal.log(Terminal.colorize(color, options.bold ? chalk_1.default.bold(line) : line));
    }
    static title(text, options) {
        if (!options) {
            options = {};
        }
        if (options.bold === undefined) {
            options.bold = true;
        }
        const lines = options.lines = options.lines === undefined ? 'both' : options.lines;
        const newLine = lines === 'top' || lines === 'both' ? '' : '\n';
        Terminal.renderChalk(newLine + text, options);
    }
    static subtitle(text, options) {
        if (!options) {
            options = {};
        }
        if (options.bold === undefined) {
            options.bold = true;
        }
        const lines = options.lines = options.lines === undefined ? 'bottom' : options.lines;
        const newLine = lines === 'top' || lines === 'both' ? '' : '\n';
        Terminal.renderChalk(newLine + text, options);
    }
    static renderChalk(content, options) {
        if (!options) {
            options = {};
        }
        if (options.bold === undefined) {
            options.bold = false;
        }
        const color = options.color;
        const lines = options.lines === undefined ? 'both' : options.lines;
        content = options.bold ? chalk_1.default.bold(content) : content;
        content = options.italic ? chalk_1.default.italic(content) : content;
        content = options.underline ? chalk_1.default.underline(content) : content;
        content = options.strikethrough ? chalk_1.default.strikethrough(content) : content;
        content = options.color ? Terminal.colorize(options.color, content) : content;
        if (lines === 'top' || lines === 'both') {
            Terminal.line({ color });
        }
        Terminal.log(content);
        if (lines === 'bottom' || lines === 'both') {
            Terminal.line({ color });
        }
    }
    static colorize(color, value) {
        const colorizer = Terminal.color(color);
        if (colorizer) {
            return colorizer(value);
        }
        else {
            return value;
        }
    }
    static color(color) {
        switch (color) {
            case 'black': return chalk_1.default.black;
            case 'blue': return chalk_1.default.blue;
            case 'cyan': return chalk_1.default.cyan;
            case 'gray': return chalk_1.default.gray;
            case 'green': return chalk_1.default.green;
            case 'grey': return chalk_1.default.grey;
            case 'magenta': return chalk_1.default.magenta;
            case 'red': return chalk_1.default.red;
            case 'white': return chalk_1.default.white;
            case 'yellow': return chalk_1.default.yellow;
            default:
                if (color) {
                    return chalk_1.default.keyword(color);
                }
                else {
                    return undefined;
                }
        }
    }
    static black(text) { return chalk_1.default.black(text); }
    static blue(text) { return chalk_1.default.blue(text); }
    static cyan(text) { return chalk_1.default.cyan(text); }
    static gray(text) { return chalk_1.default.gray(text); }
    static green(text) { return chalk_1.default.green(text); }
    static grey(text) { return chalk_1.default.grey(text); }
    static magenta(text) { return chalk_1.default.magenta(text); }
    static red(text) { return chalk_1.default.red(text); }
    static white(text) { return chalk_1.default.white(text); }
    static yellow(text) { return chalk_1.default.yellow(text); }
    static aliceblue(text) { return Terminal.colorize('aliceblue', text); }
    static antiquewhite(text) { return Terminal.colorize('antiquewhite', text); }
    static aqua(text) { return Terminal.colorize('aqua', text); }
    static aquamarine(text) { return Terminal.colorize('aquamarine', text); }
    static azure(text) { return Terminal.colorize('azure', text); }
    static beige(text) { return Terminal.colorize('beige', text); }
    static bisque(text) { return Terminal.colorize('bisque', text); }
    static blanchedalmond(text) { return Terminal.colorize('blanchedalmond', text); }
    static brown(text) { return Terminal.colorize('brown', text); }
    static burlywood(text) { return Terminal.colorize('burlywood', text); }
    static cadetblue(text) { return Terminal.colorize('cadetblue', text); }
    static coral(text) { return Terminal.colorize('coral', text); }
    static cornflowerblue(text) { return Terminal.colorize('cornflowerblue', text); }
    static cornsilk(text) { return Terminal.colorize('cornsilk', text); }
    static darkblue(text) { return Terminal.colorize('darkblue', text); }
    static darkcyan(text) { return Terminal.colorize('darkcyan', text); }
    static darkgoldenrod(text) { return Terminal.colorize('darkgoldenrod', text); }
    static darkgrey(text) { return Terminal.colorize('darkgrey', text); }
    static darkkhaki(text) { return Terminal.colorize('darkkhaki', text); }
    static darkmagenta(text) { return Terminal.colorize('darkmagenta', text); }
    static darkorchid(text) { return Terminal.colorize('darkorchid', text); }
    static darkred(text) { return Terminal.colorize('darkred', text); }
    static darksalmon(text) { return Terminal.colorize('darksalmon', text); }
    static darkslategray(text) { return Terminal.colorize('darkslategray', text); }
    static darkslategrey(text) { return Terminal.colorize('darkslategrey', text); }
    static darkturquoise(text) { return Terminal.colorize('darkturquoise', text); }
    static deepskyblue(text) { return Terminal.colorize('deepskyblue', text); }
    static dimgray(text) { return Terminal.colorize('dimgray', text); }
    static dimgrey(text) { return Terminal.colorize('dimgrey', text); }
    static floralwhite(text) { return Terminal.colorize('floralwhite', text); }
    static forestgreen(text) { return Terminal.colorize('forestgreen', text); }
    static fuchsia(text) { return Terminal.colorize('fuchsia', text); }
    static gold(text) { return Terminal.colorize('gold', text); }
    static goldenrod(text) { return Terminal.colorize('goldenrod', text); }
    static honeydew(text) { return Terminal.colorize('honeydew', text); }
    static hotpink(text) { return Terminal.colorize('hotpink', text); }
    static ivory(text) { return Terminal.colorize('ivory', text); }
    static khaki(text) { return Terminal.colorize('khaki', text); }
    static lavender(text) { return Terminal.colorize('lavender', text); }
    static lemonchiffon(text) { return Terminal.colorize('lemonchiffon', text); }
    static lightblue(text) { return Terminal.colorize('lightblue', text); }
    static lightcoral(text) { return Terminal.colorize('lightcoral', text); }
    static lightgray(text) { return Terminal.colorize('lightgray', text); }
    static lightgreen(text) { return Terminal.colorize('lightgreen', text); }
    static lightgrey(text) { return Terminal.colorize('lightgrey', text); }
    static lightseagreen(text) { return Terminal.colorize('lightseagreen', text); }
    static lightskyblue(text) { return Terminal.colorize('lightskyblue', text); }
    static lightslategray(text) { return Terminal.colorize('lightslategray', text); }
    static lightyellow(text) { return Terminal.colorize('lightyellow', text); }
    static lime(text) { return Terminal.colorize('lime', text); }
    static limegreen(text) { return Terminal.colorize('limegreen', text); }
    static maroon(text) { return Terminal.colorize('maroon', text); }
    static mediumaquamarine(text) { return Terminal.colorize('mediumaquamarine', text); }
    static mediumblue(text) { return Terminal.colorize('mediumblue', text); }
    static mediumseagreen(text) { return Terminal.colorize('mediumseagreen', text); }
    static mediumslateblue(text) { return Terminal.colorize('mediumslateblue', text); }
    static mediumspringgreen(text) { return Terminal.colorize('mediumspringgreen', text); }
    static midnightblue(text) { return Terminal.colorize('midnightblue', text); }
    static mintcream(text) { return Terminal.colorize('mintcream', text); }
    static mistyrose(text) { return Terminal.colorize('mistyrose', text); }
    static navy(text) { return Terminal.colorize('navy', text); }
    static oldlace(text) { return Terminal.colorize('oldlace', text); }
    static olive(text) { return Terminal.colorize('olive', text); }
    static orangered(text) { return Terminal.colorize('orangered', text); }
    static orchid(text) { return Terminal.colorize('orchid', text); }
    static palegoldenrod(text) { return Terminal.colorize('palegoldenrod', text); }
    static palevioletred(text) { return Terminal.colorize('palevioletred', text); }
    static papayawhip(text) { return Terminal.colorize('papayawhip', text); }
    static peachpuff(text) { return Terminal.colorize('peachpuff', text); }
    static plum(text) { return Terminal.colorize('plum', text); }
    static powderblue(text) { return Terminal.colorize('powderblue', text); }
    static purple(text) { return Terminal.colorize('purple', text); }
    static royalblue(text) { return Terminal.colorize('royalblue', text); }
    static saddlebrown(text) { return Terminal.colorize('saddlebrown', text); }
    static salmon(text) { return Terminal.colorize('salmon', text); }
    static seashell(text) { return Terminal.colorize('seashell', text); }
    static sienna(text) { return Terminal.colorize('sienna', text); }
    static silver(text) { return Terminal.colorize('silver', text); }
    static slategray(text) { return Terminal.colorize('slategray', text); }
    static slategrey(text) { return Terminal.colorize('slategrey', text); }
    static snow(text) { return Terminal.colorize('snow', text); }
    static tan(text) { return Terminal.colorize('tan', text); }
    static teal(text) { return Terminal.colorize('teal', text); }
    static thistle(text) { return Terminal.colorize('thistle', text); }
    static violet(text) { return Terminal.colorize('violet', text); }
    static wheat(text) { return Terminal.colorize('wheat', text); }
    static yellowgreen(text) { return Terminal.colorize('yellowgreen', text); }
}
exports.Terminal = Terminal;
Terminal.verboseEnabled = false;
Terminal.indent = 0;
//# sourceMappingURL=terminal.js.map