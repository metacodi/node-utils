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
exports.FileLogger = void 0;
const fs = __importStar(require("fs"));
const moment_1 = __importDefault(require("moment"));
const terminal_1 = require("../terminal/terminal");
const resource_1 = require("../resource/resource");
const task_executor_1 = require("./task-executor");
class FileLogger extends task_executor_1.TaskExecutor {
    constructor(folder, logPeriod, fileOptions) {
        super({ run: 'sync', add: 'push', consume: 'shift', delay: 0 });
        this.folder = folder;
        this.logPeriod = logPeriod;
        this.fileOptions = fileOptions;
        if (!this.fileOptions) {
            this.fileOptions = {};
        }
        if (this.fileOptions.basename === undefined) {
            this.fileOptions.basename = '';
        }
        if (this.fileOptions.extension === undefined) {
            this.fileOptions.extension = 'log';
        }
    }
    get stamp() {
        const m = (0, moment_1.default)();
        let stamp = m.format('YYYY');
        if (this.logPeriod === 'annually') {
            return stamp;
        }
        stamp += `-${m.format('MM')}`;
        if (this.logPeriod === 'monthly') {
            return stamp;
        }
        if (this.logPeriod === 'weekly') {
            stamp += `-w${Math.ceil(+m.format('DD') / 7)}`;
        }
        else {
            stamp += `-${m.format('DD')}`;
            if (this.logPeriod === 'daily') {
                return stamp;
            }
            stamp += ` ${m.format('HH')}h`;
            if (this.logPeriod === 'hourly') {
                return `${stamp}h`;
            }
            stamp += `${m.format('mm')}m`;
        }
        return stamp;
    }
    log(text) {
        super.do(text + '\n');
    }
    executeTask(task) {
        return new Promise((resolve, reject) => {
            const folder = this.folder || '.';
            if (folder !== '.' && !fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true });
            }
            const { stamp } = this;
            const { basename, extension } = this.fileOptions || {};
            const filename = `${basename}${stamp}${extension ? '.' : ''}${extension}`;
            const url = resource_1.Resource.normalize(`${folder}/${filename}`);
            resource_1.Resource.appendFile(url, task);
            resolve();
        });
    }
}
exports.FileLogger = FileLogger;
const test = (path) => {
    console.log('annually => ', (new FileLogger(path, 'annually')).stamp);
    console.log('monthly => ', (new FileLogger(path, 'monthly')).stamp);
    console.log('weekly => ', (new FileLogger(path, 'weekly')).stamp);
    console.log('daily => ', (new FileLogger(path, 'daily')).stamp);
    console.log('hourly => ', (new FileLogger(path, 'hourly')).stamp);
    console.log('minutely => ', (new FileLogger(path, 'minutely')).stamp);
    terminal_1.Terminal.line();
    const exec = new FileLogger('', 'minutely');
    ['1', '2', '3', '4', '5'].map(task => exec.log(task));
    setTimeout(() => {
        exec.log(`Aquesta tasca s'hauria d'escriure en un altre arxiu`);
    }, 1000 * 62);
};
//# sourceMappingURL=file-logger.js.map