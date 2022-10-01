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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Git = void 0;
const fs = __importStar(require("fs"));
const terminal_1 = require("../terminal/terminal");
class Git {
    constructor() {
    }
    static hasChanges(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const filter = options.filter === undefined ? 'ACDMRTUXB' : options.filter;
            const verbose = options.verbose === undefined ? false : options.verbose;
            const folder = options.folder === undefined ? '' : options.folder;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const cwd = process.cwd();
                const diffDir = !!folder && folder !== cwd;
                if (diffDir) {
                    process.chdir(folder);
                }
                const head = (yield terminal_1.Terminal.run(`git rev-parse --verify HEAD`, { verbose })).trim();
                if (verbose) {
                    console.log('head => ', head);
                }
                const changes = (yield terminal_1.Terminal.run(`git diff --name-status --diff-filter=${filter} ${head}`, { verbose })).trim();
                const lines = changes.split('\n');
                for (const l of lines) {
                    if (l.length > 2 && filter.includes(l.charAt(0)) && l.charAt(1) === '\t') {
                        resolve(true);
                        return;
                    }
                }
                if (diffDir) {
                    process.chdir(cwd);
                }
                resolve(false);
            }));
        });
    }
    static getPendingChanges(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const filter = options.filter === undefined ? 'ACDMRTUXB' : options.filter;
            const verbose = options.verbose === undefined ? false : options.verbose;
            const folder = options.folder === undefined ? '' : options.folder;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const cwd = process.cwd();
                const diffDir = !!folder && folder !== cwd;
                if (diffDir) {
                    process.chdir(folder);
                }
                const head = (yield terminal_1.Terminal.run(`git rev-parse --verify HEAD`, { verbose })).trim();
                if (!!verbose) {
                    console.log('head =>', head);
                }
                const results = yield Git.getCommitChanges(head, { filter, verbose, folder });
                if (diffDir) {
                    process.chdir(cwd);
                }
                resolve(results);
            }));
        });
    }
    static getChangesSince(date, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const filter = options.filter === undefined ? 'ACDMRTUXB' : options.filter;
            const verbose = options.verbose === undefined ? false : options.verbose;
            const folder = options.folder === undefined ? '' : options.folder;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const results = yield Git.getPendingChanges({ filter, verbose, folder });
                const cwd = process.cwd();
                const diffDir = !!folder && folder !== cwd;
                if (diffDir) {
                    process.chdir(folder);
                }
                const log = yield terminal_1.Terminal.run(`git log --since=${date.replace(' ', 'T')} --format=oneline`, { verbose });
                const commits = log.split('\n').filter(l => !!l);
                for (const commit of commits) {
                    const head = commit.split(' ')[0];
                    const changes = yield Git.getCommitChanges(head, { filter, verbose, folder });
                    results.push(...changes.filter(c => !results.find(r => r.filename === c.filename)));
                }
                if (diffDir) {
                    process.chdir(cwd);
                }
                resolve(results.sort((a, b) => a.filename > b.filename ? 1 : -1));
            }));
        });
    }
    static getCommitChanges(head, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const filter = options.filter === undefined ? 'ACDMRTUXB' : options.filter;
            const verbose = options.verbose === undefined ? false : options.verbose;
            const folder = options.folder === undefined ? '' : options.folder;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const changes = (yield terminal_1.Terminal.run(`git diff --name-status --diff-filter=${filter} ${head}`, { verbose })).trim();
                const lines = changes.split('\n');
                const results = [];
                lines.map(line => {
                    if (line.length > 2 && filter.includes(line.charAt(0)) && line.charAt(1) === '\t') {
                        const parts = line.split('\t');
                        results.push({
                            filename: parts[1],
                            status: Git.codeToStatus(parts[0])
                        });
                    }
                });
                if (verbose) {
                    console.log(results);
                }
                if (verbose) {
                    console.log('');
                }
                resolve(results);
            }));
        });
    }
    static discardChanges(resource) {
        return __awaiter(this, void 0, void 0, function* () {
            const isDirectory = fs.lstatSync(resource || '').isDirectory();
            if (isDirectory) {
                return Promise.reject(`No s'ha implementat l'opció de descartar canvis per una carpeta '${resource}'`);
            }
            else {
                return yield terminal_1.Terminal.run(`git restore ${resource}`);
            }
        });
    }
    static publish(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const commit = options.commit === undefined ? 'auto-commit' : options.commit;
            const branch = options.branch === undefined ? 'master' : options.branch;
            const run = options.run === undefined ? {} : options.run;
            const folder = options.folder === undefined ? '' : options.folder;
            const cwd = process.cwd();
            const diffDir = !!folder && folder !== cwd;
            if (diffDir) {
                process.chdir(folder);
            }
            let hasErrors = false;
            if (!hasErrors) {
                yield terminal_1.Terminal.run(`git add -A`, run).catch((err) => { hasErrors = true; terminal_1.Terminal.log(`> git add -A`); terminal_1.Terminal.error(err); });
            }
            if (!hasErrors) {
                yield terminal_1.Terminal.run(`git commit -m "${commit}"`, run).catch((err) => { hasErrors = true; terminal_1.Terminal.log(`> git commit -m "${commit}"`); terminal_1.Terminal.error(err); });
            }
            if (!hasErrors) {
                yield terminal_1.Terminal.run(`git push origin ${branch}`, run).catch((err) => { hasErrors = true; terminal_1.Terminal.log(`> git push origin ${branch}`); terminal_1.Terminal.error(err); });
            }
            if (diffDir) {
                process.chdir(cwd);
            }
            return Promise.resolve(!hasErrors);
        });
    }
    static codeToStatus(code) {
        const map = {
            A: 'Added',
            C: 'Copied',
            D: 'Deleted',
            M: 'Modified',
            R: 'Renamed',
            T: 'Type-Change',
            U: 'Unmerged',
            X: 'Unknown',
            B: 'Broken'
        };
        return Object.keys(map).find(k => k === code);
    }
    foo() { return 'bar'; }
}
exports.Git = Git;
//# sourceMappingURL=git.js.map