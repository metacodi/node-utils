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
;
class FileLogger extends task_executor_1.TaskExecutor {
    constructor(options) {
        super({ run: 'sync', add: 'push', consume: 'shift', delay: 0 });
        this.options = options;
        if (!options) {
            options = {};
        }
        this.options = options;
    }
    get folder() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.folder) || '.'; }
    get basename() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.basename) || ''; }
    get formatStamp() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.formatStamp) || ''; }
    get periodStamp() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.periodStamp) || ''; }
    get extension() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.extension) || 'log'; }
    get filename() { return `${this.basename}${this.stamp}${this.extension ? '.' : ''}${this.extension}`; }
    get fullname() { return resource_1.Resource.normalize(`${this.folder}/${this.filename}`); }
    get stamp() {
        const { formatStamp, periodStamp } = this.options || {};
        if (formatStamp) {
            const stamp = (0, moment_1.default)().format(formatStamp);
            return stamp;
        }
        else {
            if (!periodStamp) {
                return '';
            }
            const m = (0, moment_1.default)();
            let stamp = m.format('YYYY');
            if (periodStamp === 'annually') {
                return stamp;
            }
            stamp += `-${m.format('MM')}`;
            if (periodStamp === 'monthly') {
                return stamp;
            }
            if (periodStamp === 'weekly') {
                stamp += `-w${Math.ceil(+m.format('DD') / 7)}`;
            }
            else {
                stamp += `-${m.format('DD')}`;
                if (periodStamp === 'daily') {
                    return stamp;
                }
                stamp += ` ${m.format('HH')}h`;
                if (periodStamp === 'hourly') {
                    return stamp;
                }
                stamp += `${m.format('mm')}m`;
            }
            return stamp;
        }
    }
    log(text) {
        super.do(text + '\n');
    }
    executeTask(content) {
        return new Promise((resolve, reject) => {
            const { folder, fullname } = this;
            if (folder !== '.' && !fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true });
            }
            resource_1.Resource.appendFile(fullname, content);
            resolve();
        });
    }
}
exports.FileLogger = FileLogger;
const test = (folder) => {
    console.log('annually => ', (new FileLogger({ folder, periodStamp: 'annually' })).fullname);
    console.log('monthly => ', (new FileLogger({ folder, periodStamp: 'monthly' })).fullname);
    console.log('weekly => ', (new FileLogger({ folder, periodStamp: 'weekly' })).fullname);
    console.log('daily => ', (new FileLogger({ folder, periodStamp: 'daily' })).fullname);
    console.log('hourly => ', (new FileLogger({ folder, periodStamp: 'hourly' })).fullname);
    console.log('minutely => ', (new FileLogger({ folder, periodStamp: 'minutely' })).fullname);
    console.log('format => ', (new FileLogger({ folder, formatStamp: 'MMM DD YYYY' })).fullname);
    console.log('basename => ', (new FileLogger({ folder, basename: 'base_name' })).fullname);
    console.log('base + stamp => ', (new FileLogger({ folder, basename: 'base_name-', periodStamp: 'daily' })).fullname);
    console.log('without folder => ', (new FileLogger({ basename: 'base_name' })).fullname);
    terminal_1.Terminal.line();
};
//# sourceMappingURL=file-logger.js.map