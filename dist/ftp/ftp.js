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
exports.FtpClient = void 0;
const ftp_1 = __importDefault(require("ftp"));
const chalk_1 = __importDefault(require("chalk"));
const moment_1 = __importDefault(require("moment"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const resource_1 = require("../resource/resource");
const terminal_1 = require("../terminal/terminal");
const functions_1 = require("../functions/functions");
class FtpClient {
    constructor(options) {
        this.isReady = false;
        this.options = Object.assign(Object.assign({}, this.defaultOptions), options);
        this.ftp = new ftp_1.default();
        this.connect();
    }
    connect(connection) {
        const options = Object.assign(Object.assign({}, this.options), connection);
        const { host, user, password, port } = this.options;
        this.ftp.connect({ host, user, password, port });
    }
    disconnect() { this.ftp.end(); }
    ready() {
        return new Promise((resolve, reject) => {
            if (this.isReady) {
                resolve(true);
            }
            else {
                this.ftp.on('ready', () => { this.isReady = true, resolve(true); });
            }
        });
    }
    get status() {
        return new Promise((resolve, reject) => {
            this.ftp.status((error, status) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(status);
                }
            });
        });
    }
    get host() { var _a; return (_a = this.options) === null || _a === void 0 ? void 0 : _a.host; }
    get user() { var _a; return (_a = this.options) === null || _a === void 0 ? void 0 : _a.user; }
    get password() { var _a; return (_a = this.options) === null || _a === void 0 ? void 0 : _a.password; }
    get port() { var _a; return (_a = this.options) === null || _a === void 0 ? void 0 : _a.port; }
    get defaultOptions() {
        return {
            port: 21,
            connTimeout: 10000,
            keepalive: 1000,
            pasvTimeout: 1000,
            secure: false,
            secureOptions: undefined,
        };
    }
    upload(local, remote, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const start = (0, moment_1.default)();
            terminal_1.Terminal.logInline(`- Uploading ${chalk_1.default.green(local)} to ${chalk_1.default.green(remote)}`);
            const result = yield this.uploadAll(local, remote, options);
            const duration = moment_1.default.duration((0, moment_1.default)().diff(start)).asSeconds();
            terminal_1.Terminal.success(`Uploaded ${result ? 'successfully' : 'with errors'} (${duration})`);
        });
    }
    uploadAll(local, remote, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const verbose = options.verbose === undefined ? false : options.verbose;
            const filter = options.filter === undefined ? undefined : options.filter;
            const ignore = options.ignore === undefined ? undefined : options.ignore;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this.ready().then(() => __awaiter(this, void 0, void 0, function* () {
                    remote = this.normalizeRemote(remote);
                    if (this.isLocalFile(local)) {
                        if (verbose) {
                            terminal_1.Terminal.logInline(`  uploading... ${chalk_1.default.green(remote)}`);
                        }
                        try {
                            yield this.mkdir(path.dirname(remote), true);
                            yield this.put(local, remote);
                            resolve(true);
                        }
                        catch (error) {
                            if (options.continueOnError) {
                                terminal_1.Terminal.error(error, false);
                                resolve(false);
                            }
                            else {
                                reject(error);
                            }
                        }
                    }
                    else {
                        if (verbose) {
                            terminal_1.Terminal.logInline(`  uploading... ${chalk_1.default.green(remote)}`);
                        }
                        try {
                            yield this.mkdir(remote, true);
                            const resources = resource_1.Resource.discover(local, { ignore, filter });
                            const directories = resources.filter(r => r.isDirectory);
                            for (const dir of directories) {
                                yield this.uploadAll(dir.fullName, path.join(remote, dir.name), options);
                            }
                            const files = resources.filter(r => r.isFile);
                            for (const file of files) {
                                yield this.uploadAll(file.fullName, path.join(remote, file.name), options);
                            }
                            resolve(true);
                        }
                        catch (error) {
                            if (options.continueOnError) {
                                terminal_1.Terminal.error(error, false);
                                resolve(false);
                            }
                            else {
                                reject(error);
                            }
                        }
                    }
                })).catch(error => {
                    if (options.continueOnError) {
                        terminal_1.Terminal.error(error, false);
                        resolve(false);
                    }
                    else {
                        reject(error);
                    }
                });
            }));
        });
    }
    download(remote, local, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const start = (0, moment_1.default)();
            terminal_1.Terminal.logInline(`- Downloading ${chalk_1.default.green(remote)} to ${chalk_1.default.green(local)}`);
            const result = yield this.downloadAll(remote, local, options);
            const duration = moment_1.default.duration((0, moment_1.default)().diff(start)).asSeconds();
            terminal_1.Terminal.success(`Downloaded ${result ? 'successfully' : 'with errors'} (${duration}) ${chalk_1.default.green(remote)} to ${chalk_1.default.green(local)}`);
        });
    }
    downloadAll(remote, local, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const verbose = options.verbose === undefined ? false : options.verbose;
            const element = options.element === undefined ? false : options.element;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this.ready().then(() => __awaiter(this, void 0, void 0, function* () {
                    remote = this.normalizeRemote(remote);
                    const enabled = !options.ignore || !(0, functions_1.applyFilterPattern)(remote, options.ignore);
                    const filtered = !options.filter || (0, functions_1.applyFilterPattern)(remote, options.filter);
                    if (enabled && filtered) {
                        const isRemoteFile = element ? !this.isRemoteDirectory(element) : !!path.extname(remote);
                        if (isRemoteFile) {
                            if (verbose) {
                                terminal_1.Terminal.logInline(`  downloading... ${chalk_1.default.green(remote)}`);
                            }
                            try {
                                fs.mkdirSync(path.dirname(local), { recursive: true });
                                const filePath = fs.createWriteStream(local);
                                const stream = yield this.get(remote);
                                stream.pipe(filePath);
                                filePath.on('finish', () => {
                                    filePath.close();
                                    resolve(true);
                                }).on('error', error => {
                                    filePath.close();
                                    reject(error);
                                });
                            }
                            catch (error) {
                                if (options.continueOnError) {
                                    terminal_1.Terminal.error(error, false);
                                    resolve(false);
                                }
                                else {
                                    reject(error);
                                }
                            }
                        }
                        else {
                            if (verbose) {
                                terminal_1.Terminal.logInline(`  downloading... ${chalk_1.default.green(remote)}`);
                            }
                            try {
                                fs.mkdirSync(local, { recursive: true });
                                const resources = yield this.list(remote);
                                for (const el of [...resources.filter(r => this.isRemoteDirectory(r)), ...resources.filter(r => this.isRemoteFile(r))]) {
                                    yield this.downloadAll(path.join(remote, el.name), path.join(local, el.name), Object.assign(Object.assign({}, options), { element: el }));
                                }
                                resolve(true);
                            }
                            catch (error) {
                                if (options.continueOnError) {
                                    terminal_1.Terminal.error(error, false);
                                    resolve(false);
                                }
                                else {
                                    reject(error);
                                }
                            }
                        }
                    }
                    else {
                        resolve(false);
                    }
                }));
            }));
        });
    }
    remove(remote, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const start = (0, moment_1.default)();
            terminal_1.Terminal.logInline(`- Deleting ${chalk_1.default.green('www/app/')} from server`);
            const result = yield this.removeAll(remote, options);
            const duration = moment_1.default.duration((0, moment_1.default)().diff(start)).asSeconds();
            terminal_1.Terminal.success(`Deleted ${result ? 'successfully' : 'with errors'} (${duration})`);
        });
    }
    removeAll(remote, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const verbose = options.verbose === undefined ? false : options.verbose;
            const continueOnError = options.continueOnError === undefined ? true : options.continueOnError;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this.ready().then(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        remote = this.normalizeRemote(remote);
                        const isFile = !!path.extname(remote);
                        if (isFile) {
                            if (verbose) {
                                terminal_1.Terminal.logInline(`  deleting... ${chalk_1.default.green(remote)}`);
                            }
                            yield this.delete(remote);
                            resolve(true);
                        }
                        else {
                            if (verbose) {
                                terminal_1.Terminal.logInline(`  deleting... ${chalk_1.default.green(remote)}`);
                            }
                            const list = yield this.list(remote);
                            const directories = list.filter(r => r.type === 'd' && r.name !== '..' && r.name !== '.').map(r => path.posix.join(remote, r.name));
                            const files = list.filter(r => r.type !== 'd').map(r => path.posix.join(remote, r.name));
                            for (const dir of directories) {
                                yield this.removeAll(dir, options);
                            }
                            for (const file of files) {
                                yield this.removeAll(file, options);
                            }
                            yield this.rmdir(remote, false, { continueOnError });
                            resolve(true);
                        }
                    }
                    catch (error) {
                        if (continueOnError) {
                            terminal_1.Terminal.error(error, false);
                            resolve(false);
                        }
                        else {
                            reject(error);
                        }
                    }
                }));
            }));
        });
    }
    mkdir(remote, recursive) {
        if (recursive === undefined) {
            recursive = true;
        }
        return new Promise((resolve, reject) => {
            this.ready().then(() => __awaiter(this, void 0, void 0, function* () {
                remote = this.normalizeRemote(remote);
                if (remote === '/') {
                    resolve(false);
                }
                else {
                    this.ftp.mkdir(remote, recursive, error => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(true);
                        }
                    });
                }
            }));
        });
    }
    rmdir(remote, recursive, options) {
        if (!options) {
            options = {};
        }
        const continueOnError = options.continueOnError === undefined ? false : options.continueOnError;
        return new Promise((resolve, reject) => {
            this.ready().then(() => __awaiter(this, void 0, void 0, function* () {
                remote = this.normalizeRemote(remote);
                if (remote === '/') {
                    resolve(false);
                }
                else {
                    this.ftp.rmdir(remote, recursive, error => {
                        if (error) {
                            if (continueOnError) {
                                terminal_1.Terminal.error(error, false);
                                resolve(false);
                            }
                            else {
                                reject(error);
                            }
                        }
                        else {
                            resolve(true);
                        }
                    });
                }
            }));
        });
    }
    get(remote) {
        return new Promise((resolve, reject) => {
            remote = this.normalizeRemote(remote);
            this.ftp.get(remote, (error, stream) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(stream);
                }
            });
        });
    }
    put(local, remote) {
        return new Promise((resolve, reject) => {
            this.ftp.put(local, this.normalizeRemote(remote), error => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    delete(remote) {
        return new Promise((resolve, reject) => {
            this.ready().then(() => __awaiter(this, void 0, void 0, function* () {
                this.ftp.delete(this.normalizeRemote(remote), error => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));
        });
    }
    list(remote) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            this.ready().then(() => __awaiter(this, void 0, void 0, function* () {
                remote = this.normalizeRemote(remote);
                if (!remote) {
                    remote = yield this.pwd();
                }
                this.ftp.list(remote, (error, list) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(list);
                    }
                });
            }));
        }));
    }
    pwd() {
        return new Promise((resolve, reject) => {
            this.ready().then(() => __awaiter(this, void 0, void 0, function* () {
                this.ftp.pwd((error, remote) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(remote);
                    }
                });
            }));
        });
    }
    abort() {
        return new Promise((resolve, reject) => {
            this.ready().then(() => __awaiter(this, void 0, void 0, function* () {
                this.ftp.abort((error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            }));
        });
    }
    ascii() {
        return new Promise((resolve, reject) => {
            this.ready().then(() => __awaiter(this, void 0, void 0, function* () {
                this.ftp.ascii((error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            }));
        });
    }
    binary() {
        return new Promise((resolve, reject) => {
            this.ready().then(() => __awaiter(this, void 0, void 0, function* () {
                this.ftp.binary((error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            }));
        });
    }
    normalizeRemote(resource) { return path.normalize(resource).replace(new RegExp('\\\\', 'g'), '/'); }
    isRemoteDirectory(el) { return el.type === 'd' && el.name !== '.' && el.name !== '..'; }
    isRemoteFile(el) { return el.type === '-'; }
    isLocalDirectory(resource) { return fs.lstatSync(resource).isDirectory(); }
    isLocalFile(resource) { return fs.lstatSync(resource).isFile(); }
}
exports.FtpClient = FtpClient;
//# sourceMappingURL=ftp.js.map