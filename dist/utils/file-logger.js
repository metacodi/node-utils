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
    constructor(folder, logPeriod, fileExtension = 'log') {
        super({ run: 'sync', add: 'push', consume: 'shift', delay: 0 });
        this.folder = folder;
        this.logPeriod = logPeriod;
        this.fileExtension = fileExtension;
    }
    getFileName() {
        const m = (0, moment_1.default)();
        let fileName = m.format('YYYY');
        if (this.logPeriod === 'annually') {
            return fileName;
        }
        fileName += `-${m.format('MM')}`;
        if (this.logPeriod === 'monthly') {
            return fileName;
        }
        if (this.logPeriod === 'weekly') {
            fileName += `-w${Math.ceil(+m.format('DD') / 7)}`;
        }
        else {
            fileName += `-${m.format('DD')}`;
            if (this.logPeriod === 'daily') {
                return fileName;
            }
            fileName += ` ${m.format('HH')}h`;
            if (this.logPeriod === 'hourly') {
                return `${fileName}h`;
            }
            fileName += `${m.format('mm')}m`;
        }
        return fileName;
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
            const url = resource_1.Resource.normalize(`${folder}/${this.getFileName()}.${this.fileExtension}`);
            resource_1.Resource.appendFile(url, task);
            resolve();
        });
    }
}
exports.FileLogger = FileLogger;
const test = (path) => {
    console.log('annually => ', (new FileLogger(path, 'annually')).getFileName());
    console.log('monthly => ', (new FileLogger(path, 'monthly')).getFileName());
    console.log('weekly => ', (new FileLogger(path, 'weekly')).getFileName());
    console.log('daily => ', (new FileLogger(path, 'daily')).getFileName());
    console.log('hourly => ', (new FileLogger(path, 'hourly')).getFileName());
    console.log('minutely => ', (new FileLogger(path, 'minutely')).getFileName());
    terminal_1.Terminal.line();
    const exec = new FileLogger('', 'minutely');
    ['1', '2', '3', '4', '5'].map(task => exec.log(task));
    setTimeout(() => {
        exec.log(`Aquesta tasca s'hauria d'escriure en un altre arxiu`);
    }, 1000 * 62);
};
//# sourceMappingURL=file-logger.js.map