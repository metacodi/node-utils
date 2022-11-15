"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskExecutor = void 0;
const moment_1 = __importDefault(require("moment"));
const timestamp = (inp) => (0, moment_1.default)(inp).format('YYYY-MM-DD HH:mm:ss.SSS');
const logTime = (message, ...optionalParams) => console.log(`${timestamp()} -> ${message}`, ...optionalParams);
;
class TaskExecutor {
    constructor(options) {
        this.options = options;
        this.queue = [];
        this.executingTask = false;
        this.isSleeping = false;
        this.changeLimitsPending = false;
        this.countPeriod = 0;
        this.intervalSubscription = undefined;
        if (!options) {
            options = {};
        }
        if (options.run === undefined) {
            options.run = 'sync';
        }
        if (options.add === undefined) {
            options.add = 'push';
        }
        if (options.consume === undefined) {
            options.consume = 'shift';
        }
        if (options.delay === undefined) {
            options.delay = 0;
        }
        if (options.maxQuantity === undefined) {
            options.maxQuantity = 0;
        }
        if (options.period === undefined) {
            options.period = 0;
        }
        this.options = options;
    }
    do(task) {
        this.addTask(task);
        this.executeQueue();
    }
    executeQueue() {
        if (this.executingTask) {
            return;
        }
        if (this.hasTasksToConsume) {
            if (!!this.maxQuantity && !this.isTaskIntervalOn) {
                this.startTasksInterval();
            }
            this.executingTask = true;
            if (this.run === 'sync') {
                if (this.delay) {
                    setTimeout(() => this.nextTask(), this.delay);
                }
                else {
                    this.nextTask();
                }
            }
            else {
                while (this.hasTasksToConsume && !this.isSleeping) {
                    const task = this.consumeTask();
                    if (!!this.period) {
                        this.countPeriod += 1;
                    }
                    this.executeTask(task);
                }
                this.executingTask = false;
            }
        }
    }
    nextTask() {
        const task = this.consumeTask();
        if (!!this.period) {
            this.countPeriod += 1;
        }
        this.executeTask(task).finally(() => {
            this.executingTask = false;
            this.executeQueue();
        });
    }
    startTasksInterval() {
        const { period } = this;
        if (this.intervalSubscription !== undefined) {
            clearInterval(this.intervalSubscription);
        }
        this.countPeriod = 0;
        this.intervalSubscription = setInterval(() => this.processTasksInterval(), period * 1000);
    }
    stopTasksInterval() {
        if (this.intervalSubscription !== undefined) {
            clearInterval(this.intervalSubscription);
        }
        this.intervalSubscription = undefined;
    }
    sleepTasksInterval(period) {
        if (!period) {
            period = 10;
        }
        this.isSleeping = true;
        this.stopTasksInterval();
        this.countPeriod = 0;
        this.executingTask = false;
        setTimeout(() => {
            this.isSleeping = false;
            this.executeQueue();
        }, period * 1000);
    }
    processTasksInterval() {
        if (this.changeLimitsPending) {
            this.changeLimitsPending = false;
            this.stopTasksInterval();
            return this.executeQueue();
        }
        if (this.countPeriod > 0) {
            this.countPeriod = 0;
            if (this.hasPriority) {
                this.sortTasksByPriority();
            }
            this.executeQueue();
        }
        else {
            return this.stopTasksInterval();
        }
        ;
    }
    get isTaskIntervalOn() { return this.intervalSubscription !== undefined; }
    updateLimit(limit) { Object.assign(this.options || {}, limit); this.changeLimitsPending = this.isTaskIntervalOn; }
    addTask(task) { if (this.add === 'unshift') {
        this.queue.unshift(task);
    }
    else {
        this.queue.push(task);
    } }
    consumeTask() { return this.consume === 'shift' ? this.queue.shift() : this.queue.pop(); }
    tryAgainTask() { return this.consume === 'shift' ? this.queue.unshift() : this.queue.push(); }
    get hasTasksToConsume() { return !!this.queue.length && (!this.maxQuantity || (this.countPeriod < this.maxQuantity)); }
    sortTasksByPriority() { this.queue.sort((taskA, taskB) => ((taskA === null || taskA === void 0 ? void 0 : taskA.priority) || 1) - ((taskB === null || taskB === void 0 ? void 0 : taskB.priority) || 1)); }
    get hasPriority() { return !!this.queue.length && typeof this.queue[0] === 'object' && this.queue[0].hasOwnProperty('priority'); }
    get run() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.run) || 'sync'; }
    get add() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.add) || 'push'; }
    get consume() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.consume) || 'shift'; }
    get delay() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.delay) || 0; }
    get period() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.period) || 0; }
    get maxQuantity() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.maxQuantity) || 0; }
}
exports.TaskExecutor = TaskExecutor;
class TestTaskExecutor extends TaskExecutor {
    stringify(task) { return typeof task === 'object' ? JSON.stringify(task) : task; }
    do(task) {
        logTime(`do task ${this.stringify(task)}`);
        super.do(task);
    }
    executeTask(task) {
        return new Promise((resolve, reject) => {
            logTime(`exec task ${this.stringify(task)}`);
            setTimeout(() => {
                resolve();
            }, 100);
        });
    }
}
const test = (options) => {
    const exec = new TestTaskExecutor(options);
    for (let i = 1; i <= 5; i++) {
        exec.do(`${i}`);
    }
};
const testAsync = (options) => {
    const exec = new TestTaskExecutor(options);
    for (let i = 1; i < 9; i++) {
        exec.do(`${i}`);
    }
    setTimeout(() => {
        exec.do('A');
        exec.do('B');
    }, 9000);
};
const testPriority = (options) => {
    const exec = new TestTaskExecutor(options);
    const rmin = 1;
    const rmax = 5;
    for (let i = 1; i <= 60; i++) {
        const priority = Math.floor(Math.random() * (rmax - rmin + 1) + rmin);
        exec.do({ i, priority });
    }
    setTimeout(() => {
        exec.do({ i: 'A', priority: 2 });
        exec.do({ i: 'B', priority: 1 });
        exec.do({ i: 'C', priority: 3 });
        exec.do({ i: 'D', priority: 4 });
        exec.do({ i: 'E', priority: 5 });
    }, 5000);
};
//# sourceMappingURL=task-executor.js.map