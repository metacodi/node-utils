"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resource = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const moment_1 = __importDefault(require("moment"));
const terminal_1 = require("../terminal/terminal");
const functions_1 = require("../functions/functions");
class Resource {
    static concat(folder, fileName) {
        if (!folder) {
            return fileName;
        }
        if (!fileName) {
            return folder;
        }
        const concat = (folder.endsWith('/') || folder.endsWith('\\')) ? '' : '/';
        const file = (fileName.startsWith('/') || fileName.startsWith('\\')) ? fileName.substring(1) : fileName;
        return Resource.normalize(folder + concat + file);
    }
    static normalize(fileName) {
        const find = process.platform === 'win32' ? '/' : '\\\\';
        const replace = Resource.platformPathSeparator;
        return fileName.replace(new RegExp(find, 'g'), replace);
    }
    static split(value) {
        return Resource.normalize(value).replace('\\', '/').split('/');
    }
    static join(values) {
        return Resource.normalize(values.join('/'));
    }
    static get platformPathSeparator() {
        return process.platform === 'win32' ? '\\' : '/';
    }
    static appendFile(fileName, content, options) {
        if (!options) {
            options = {};
        }
        const encoding = options.encoding === undefined ? 'utf8' : options.encoding;
        fs.appendFileSync(fileName, content, { encoding });
    }
    static open(fileName, options) {
        if (!options) {
            options = {};
        }
        const encoding = options.encoding === undefined ? 'utf8' : options.encoding;
        let content = fs.readFileSync(fileName, { encoding }).toString();
        const file = Resource.discover(fileName);
        if (options.parseJsonFile === true || (options.parseJsonFile === undefined && file.extension === '.json')) {
            try {
                if (file.name.startsWith('tsconfig')) {
                    content = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');
                    content = content.replace(/\,[\s]*\}/gm, '}');
                    content = content.replace(/\,[\s]*\]/gm, ']');
                }
                return JSON.parse(options.wrapAsArray ? `[${content}]` : content);
            }
            catch (err) {
                terminal_1.Terminal.error(`Error parsejant l'arxiu JSON '${terminal_1.Terminal.file(fileName)}'.`, false);
                return undefined;
            }
        }
        return content;
    }
    static save(fileName, content, options) {
        try {
            if (!options) {
                options = {};
            }
            if (Resource.exists(fileName)) {
                const file = Resource.discover(fileName);
                if (file.extension === '.json' && typeof content === 'object') {
                    content = JSON.stringify(content, null, 2);
                }
            }
            fs.writeFileSync(fileName, content, options);
            return true;
        }
        catch (err) {
            terminal_1.Terminal.error(`Error parsejant l'arxiu JSON '${terminal_1.Terminal.file(fileName)}'.`, false);
            return false;
        }
    }
    static exists(resource) {
        try {
            return fs.existsSync(resource);
        }
        catch (err) {
            return false;
        }
    }
    static isAccessible(resource) {
        try {
            fs.accessSync(resource, fs.constants.F_OK);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    static isReadable(resource) {
        try {
            fs.accessSync(resource, fs.constants.R_OK);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    static isWriteable(resource) {
        try {
            fs.accessSync(resource, fs.constants.W_OK);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    static isReadOnly(resource) {
        return this.isAccessible(resource) && this.isReadable(resource) && !this.isWriteable(resource);
    }
    static isDirectory(resource) { return fs.lstatSync(resource).isDirectory(); }
    static isFile(resource) { return fs.lstatSync(resource).isFile(); }
    static discover(resource, options, indent = '') {
        if (!options) {
            options = {};
        }
        if (options.ignore === undefined) {
            options.ignore = 'node_modules|\.git';
        }
        if (options.recursive === undefined) {
            options.recursive = false;
        }
        if (!!options.ignore && typeof options.ignore === 'string') {
            options.ignore = new RegExp(options.ignore);
        }
        if (!!options.filter && typeof options.filter === 'string') {
            options.filter = new RegExp(options.filter);
        }
        if (!fs.existsSync(resource) || !Resource.isAccessible(resource)) {
            terminal_1.Terminal.error(`No existeix el recurs '${terminal_1.Terminal.file(resource)}'`);
            return [];
        }
        const content = [];
        const resourceIsDirectory = fs.lstatSync(resource).isDirectory();
        if (resource.length === 2 && resource.endsWith(':'))
            resource += (process.platform === 'win32' ? '\\' : '/');
        const resources = resourceIsDirectory ? fs.readdirSync(resource) : [path.basename(resource)];
        resource = resourceIsDirectory ? resource : path.dirname(resource);
        for (const name of Object.values(resources)) {
            const fullName = path.join(resource, name);
            try {
                const accessible = Resource.isAccessible(fullName);
                const enabled = !options.ignore || !(0, functions_1.applyFilterPattern)(name, options.ignore);
                const filtered = !options.filter || (0, functions_1.applyFilterPattern)(name, options.filter);
                if (accessible && enabled && filtered) {
                    const stat = fs.statSync(fullName);
                    const info = {
                        name,
                        path: resource,
                        fullName,
                        isDirectory: stat.isDirectory(),
                        isFile: stat.isFile(),
                        extension: stat.isDirectory() ? '' : path.extname(name),
                        size: stat.size,
                        created: stat.birthtime,
                        modified: stat.mtime,
                    };
                    if (resourceIsDirectory) {
                        content.push(info);
                    }
                    else {
                        return info;
                    }
                    if (info.isDirectory && options.recursive) {
                        info.children = this.discover(fullName, options, indent + '  ');
                    }
                }
            }
            catch (error) {
            }
        }
        return content;
    }
    static copy(source, target, options) {
        const start = (0, moment_1.default)();
        terminal_1.Terminal.logInline(`- Copying ${chalk_1.default.green(source)} to ${chalk_1.default.green(target)}`);
        if (fs.lstatSync(source).isDirectory()) {
            const duration = moment_1.default.duration((0, moment_1.default)().diff(start)).asSeconds();
            const result = Resource.copyFolderSync(source, target, options);
            terminal_1.Terminal.success(`Copied ${result ? 'successfully' : 'with errors'} (${duration})`);
        }
        else {
            Resource.copyFileSync(source, target, options);
            terminal_1.Terminal.success(`Copied successfully ${chalk_1.default.green(target)}`);
        }
    }
    static copyFileSync(source, target, options, indent = '') {
        if (!options) {
            options = {};
        }
        const verbose = options.verbose === undefined ? terminal_1.Terminal.verboseEnabled : !!options.verbose;
        const file = path.basename(source);
        if (verbose) {
            terminal_1.Terminal.logInline(`  copying... ${chalk_1.default.green(file)}`);
        }
        let targetFile = target;
        if (fs.existsSync(target)) {
            if (fs.lstatSync(target).isDirectory()) {
                targetFile = path.join(target, path.basename(source));
            }
        }
        fs.writeFileSync(targetFile, fs.readFileSync(source));
    }
    static copyFolderSync(source, target, options, indent = '') {
        if (!options) {
            options = {};
        }
        const filter = options.filter === undefined ? '' : options.filter;
        const createFolderInTarget = options.createFolderInTarget === undefined ? true : options.createFolderInTarget;
        const verbose = options.verbose === undefined ? terminal_1.Terminal.verboseEnabled : !!options.verbose;
        const files = [];
        const targetFolder = createFolderInTarget ? path.join(target, path.basename(source)) : target;
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder);
        }
        let copied = 0;
        if (fs.lstatSync(source).isDirectory()) {
            files.push(...fs.readdirSync(source));
            files.forEach((file) => {
                const origin = path.join(source, file);
                if (fs.lstatSync(origin).isDirectory()) {
                    if ((0, functions_1.applyFilterPattern)(origin, filter) && Resource.hasFilteredFiles(origin, filter)) {
                        if (verbose) {
                            terminal_1.Terminal.logInline(`  copying... ${chalk_1.default.green(origin)}`);
                        }
                        copied += Resource.copyFolderSync(origin, targetFolder, { verbose, filter }, indent + '  ');
                    }
                    else {
                        if (verbose) {
                            terminal_1.Terminal.logInline(`  ignored... ${chalk_1.default.redBright(file)}`);
                        }
                    }
                }
            });
            files.forEach((file) => {
                const origin = path.join(source, file);
                if (!fs.lstatSync(origin).isDirectory()) {
                    if ((0, functions_1.applyFilterPattern)(origin, filter)) {
                        Resource.copyFileSync(origin, targetFolder, { verbose }, indent + '  ');
                        copied++;
                    }
                    else {
                        if (verbose) {
                            terminal_1.Terminal.logInline(`  ignored... ${chalk_1.default.redBright(file)}`);
                        }
                    }
                }
            });
        }
        return copied;
    }
    static removeSync(resource, options) {
        if (!options) {
            options = {};
        }
        const recursive = options.recursive === undefined ? true : options.recursive;
        const force = options.force === undefined ? true : options.force;
        const maxRetries = options.maxRetries === undefined ? 0 : options.maxRetries;
        const retryDelay = options.retryDelay === undefined ? 100 : options.retryDelay;
        const verbose = options.verbose === undefined ? false : options.verbose;
        if (verbose) {
            terminal_1.Terminal.log(`Eliminant ${Resource.isFile(resource) ? `l'arxiu` : `la carpeta`} ${chalk_1.default.green(resource)}.`);
        }
        if (Resource.exists(resource)) {
            fs.rmSync(resource, { recursive, force, maxRetries, retryDelay });
        }
    }
    static rename(oldName, newName) {
        return new Promise((resolve, reject) => {
            fs.rename(oldName, newName, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    static hasFilteredFiles(folder, filter) {
        if (!fs.lstatSync(folder).isDirectory()) {
            return false;
        }
        for (const file of fs.readdirSync(folder)) {
            const origin = path.join(folder, file);
            if (fs.lstatSync(origin).isFile()) {
                if ((0, functions_1.applyFilterPattern)(origin, filter)) {
                    return true;
                }
            }
            else {
                if ((0, functions_1.applyFilterPattern)(origin, filter) && Resource.hasFilteredFiles(origin, filter)) {
                    return true;
                }
            }
        }
        return false;
    }
}
exports.Resource = Resource;
//# sourceMappingURL=resource.js.map