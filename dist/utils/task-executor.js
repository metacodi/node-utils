"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskExecutor = void 0;
const events_1 = __importDefault(require("events"));
const moment_1 = __importDefault(require("moment"));
const deep_merge_1 = require("./deep-merge");
const functions_1 = require("../functions/functions");
const terminal_1 = require("../terminal/terminal");
;
;
class TaskExecutor extends events_1.default {
    constructor(options) {
        super({ captureRejections: false });
        this.options = options;
        this.queue = [];
        this.isExecutingTask = false;
        this.currentTask = undefined;
        this.history = [];
        this.isSleeping = false;
        this.isExecutionPaused = false;
        this.changeLimitsPending = false;
        this.executedTasksInPeriod = 0;
        this.maxTasksCheckingSubscription = undefined;
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
        if (options.maxTasksInPeriod === undefined) {
            options.maxTasksInPeriod = 0;
        }
        if (options.maxTasksCheckingPeriod === undefined) {
            options.maxTasksCheckingPeriod = 0;
        }
        this.options = options;
    }
    do(task) {
        this.addTask(task);
        if (this.hasPriority) {
            this.sortTasksByPriority();
        }
        this.executeQueue();
    }
    doTask(task) {
        this.addTask(task);
        if (this.hasPriority) {
            this.sortTasksByPriority();
        }
        this.executeQueue();
    }
    doTasks(tasks) {
        if (!Array.isArray(tasks)) {
            tasks = !tasks ? [] : [tasks];
        }
        (tasks || []).forEach(task => this.addTask(task));
        if (this.hasPriority) {
            this.sortTasksByPriority();
        }
        this.executeQueue();
    }
    executeQueue() {
        if (this.isExecutionPaused) {
            return;
        }
        if (this.isExecutingTask) {
            return;
        }
        if (this.hasTasksToConsume) {
            if (this.maxTasksInPeriod > 0 && !this.isMaxTaskCheckingStarted) {
                this.startMaxTasksCheckingInterval();
            }
            this.isExecutingTask = true;
            if (this.run === 'sync') {
                if (this.delay) {
                    setTimeout(() => this.nextTask(), this.delay);
                }
                else {
                    this.nextTask();
                }
            }
            else {
                while (this.hasTasksToConsume && !this.isSleeping && !this.isExecutionPaused) {
                    const task = this.consumeTask();
                    const result = { task, started: (0, functions_1.timestamp)() };
                    if (this.maxTasksInPeriod > 0) {
                        this.executedTasksInPeriod += 1;
                    }
                    let timeout;
                    let isTimeoutDone = false;
                    const period = (typeof task !== 'string' ? task.timeout : 0) || this.timeoutTaskPeriod || 0;
                    if (period > 0) {
                        timeout = setTimeout(() => {
                            isTimeoutDone = true;
                            const d = moment_1.default.duration(period, 'milliseconds');
                            const t = (0, moment_1.default)().hours(d.hours()).minutes(d.minutes()).seconds(d.seconds()).milliseconds(d.milliseconds());
                            result.error = { message: `Timeout error (duration: ${t.format('HH:mm:ss.SSS')})` };
                            result.ended = (0, functions_1.timestamp)();
                            this.history.unshift(result);
                            if (timeout) {
                                clearTimeout(timeout);
                            }
                            this.emit('taskTimeout', result);
                        }, period);
                    }
                    this.emit('executingTask', result);
                    this.executeTask(task).catch(error => {
                        result.error = error;
                    }).finally(() => {
                        if (period === 0 || !isTimeoutDone) {
                            result.ended = (0, functions_1.timestamp)();
                            this.history.unshift(result);
                            if (timeout) {
                                clearTimeout(timeout);
                            }
                            this.emit('taskExecuted', result);
                        }
                        else {
                            result.ended = (0, functions_1.timestamp)();
                            this.emit('taskExecuted', result);
                        }
                    });
                }
                this.isExecutingTask = false;
                this.currentTask = undefined;
            }
        }
    }
    pauseQueue() {
        this.isExecutionPaused = true;
        this.stopMaxTasksCheckingInterval();
    }
    resumeQueue() {
        this.isExecutionPaused = false;
        this.executeQueue();
    }
    nextTask() {
        if (this.isExecutionPaused) {
            return;
        }
        const task = this.consumeTask();
        const result = { task, started: (0, functions_1.timestamp)() };
        this.currentTask = task;
        if (this.maxTasksInPeriod > 0) {
            this.executedTasksInPeriod += 1;
        }
        let timeout;
        let isTimeoutDone = false;
        const period = (typeof task !== 'string' ? task.timeout : 0) || this.timeoutTaskPeriod || 0;
        if (period > 0) {
            timeout = setTimeout(() => {
                isTimeoutDone = true;
                const d = moment_1.default.duration(period, 'milliseconds');
                const t = (0, moment_1.default)().hours(d.hours()).minutes(d.minutes()).seconds(d.seconds()).milliseconds(d.milliseconds());
                result.error = { message: `Timeout error (duration: ${t.format('HH:mm:ss.SSS')})` };
                result.ended = (0, functions_1.timestamp)();
                this.history.unshift(result);
                if (timeout) {
                    clearTimeout(timeout);
                }
                this.emit('taskTimeout', result);
                this.isExecutingTask = false;
                this.currentTask = undefined;
                this.executeQueue();
            }, period);
        }
        this.emit('executingTask', result);
        this.executeTask(task).catch(error => {
            result.error = error;
        }).finally(() => {
            if (period === 0 || !isTimeoutDone) {
                result.ended = (0, functions_1.timestamp)();
                this.history.unshift(result);
                if (timeout) {
                    clearTimeout(timeout);
                }
                this.emit('taskExecuted', result);
                this.isExecutingTask = false;
                this.currentTask = undefined;
                this.executeQueue();
            }
            else {
                result.ended = (0, functions_1.timestamp)();
                this.emit('taskExecuted', result);
            }
        });
    }
    startMaxTasksCheckingInterval() {
        const { maxTasksCheckingPeriod } = this;
        if (this.maxTasksInPeriod > 0) {
            if (this.maxTasksCheckingSubscription !== undefined) {
                clearInterval(this.maxTasksCheckingSubscription);
            }
            this.executedTasksInPeriod = 0;
            this.maxTasksCheckingSubscription = setInterval(() => this.processMaxTasksCheckingInterval(), maxTasksCheckingPeriod * 1000);
        }
    }
    stopMaxTasksCheckingInterval() {
        if (this.maxTasksCheckingSubscription !== undefined) {
            clearInterval(this.maxTasksCheckingSubscription);
        }
        this.maxTasksCheckingSubscription = undefined;
    }
    sleepMaxTasksCheckingInterval(period) {
        if (!period) {
            period = 10;
        }
        this.isSleeping = true;
        this.stopMaxTasksCheckingInterval();
        this.executedTasksInPeriod = 0;
        this.isExecutingTask = false;
        this.currentTask = undefined;
        setTimeout(() => {
            this.isSleeping = false;
            this.executeQueue();
        }, period * 1000);
    }
    processMaxTasksCheckingInterval() {
        if (this.changeLimitsPending) {
            this.changeLimitsPending = false;
            this.stopMaxTasksCheckingInterval();
            return this.executeQueue();
        }
        if (this.executedTasksInPeriod === 0) {
            return this.stopMaxTasksCheckingInterval();
        }
        this.executedTasksInPeriod = 0;
        this.executeQueue();
    }
    get isMaxTaskCheckingStarted() { return this.maxTasksCheckingSubscription !== undefined; }
    getTasks(options) {
        if (!options) {
            options = {};
        }
        const includeCurrentTask = options.includeCurrentTask === undefined ? false : options.includeCurrentTask;
        const cloneTasks = options.cloneTasks === undefined ? false : options.cloneTasks;
        const { queue, isExecutingTask, currentTask } = this;
        const tasks = cloneTasks ? (0, deep_merge_1.deepClone)([...queue]) : [...queue];
        if (includeCurrentTask && isExecutingTask && !!currentTask) {
            const task = cloneTasks ? (0, deep_merge_1.deepClone)(currentTask) : currentTask;
            if (this.consume === 'shift') {
                tasks.unshift(task);
            }
            else {
                tasks.push(task);
            }
        }
        return tasks;
    }
    addTask(task) { if (this.add === 'unshift') {
        this.queue.unshift(task);
    }
    else {
        this.queue.push(task);
    } }
    consumeTask() { return this.consume === 'shift' ? this.queue.shift() : this.queue.pop(); }
    restoreTask(task) { return this.consume === 'shift' ? this.queue.unshift(task) : this.queue.push(task); }
    get hasTasksToConsume() { return !!this.queue.length && (!this.maxTasksInPeriod || (this.executedTasksInPeriod < this.maxTasksInPeriod)); }
    sortTasksByPriority() { if (this.hasPriority) {
        this.queue.sort((taskA, taskB) => ((taskA === null || taskA === void 0 ? void 0 : taskA.priority) || 1) - ((taskB === null || taskB === void 0 ? void 0 : taskB.priority) || 1));
    } }
    get hasPriority() { return !!this.queue.length && typeof this.queue[0] === 'object' && this.queue[0].hasOwnProperty('priority'); }
    get run() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.run) || 'sync'; }
    get add() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.add) || 'push'; }
    get consume() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.consume) || 'shift'; }
    get delay() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.delay) || 0; }
    get timeoutTaskPeriod() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.timeoutTaskPeriod) || 0; }
    get maxTasksCheckingPeriod() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.maxTasksCheckingPeriod) || 0; }
    get maxTasksInPeriod() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.maxTasksInPeriod) || 0; }
}
exports.TaskExecutor = TaskExecutor;
class TestExecutor extends TaskExecutor {
    constructor(options) {
        super(options);
        this.options = options;
        terminal_1.Terminal.title(`run: ${terminal_1.Terminal.green(this.run)}, add: ${terminal_1.Terminal.green(this.add)}, consume: ${terminal_1.Terminal.green(this.consume)}, delay: ${terminal_1.Terminal.green(this.delay)}`);
    }
    stringify(task) { return typeof task === 'object' ? JSON.stringify(task) : task; }
    doTasks(tasks) {
        tasks.forEach(task => (0, functions_1.logTime)(`do task ${this.stringify(task)}`));
        super.doTasks(tasks);
    }
    executeTask(task) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(), 1000);
        });
    }
}
const test = (options) => {
    const exec = new TestExecutor(options);
    const tasks = [];
    for (let i = 1; i <= 5; i++) {
        tasks.push(`${i}`);
    }
    exec.doTasks(tasks);
};
const testAsync = (options) => {
    const exec = new TestExecutor(options);
    const tasks = [];
    for (let i = 1; i < 9; i++) {
        tasks.push(`${i}`);
    }
    exec.doTasks(tasks);
    setTimeout(() => {
        exec.doTasks(['A', 'B']);
    }, 3000);
};
;
const testPriority = (options) => {
    const exec = new TestExecutor(options);
    exec.on('executingTask', (result) => {
        console.log('executingTask => ', result.task);
    });
    exec.on('taskExecuted', (result) => {
        console.log('taskExecuted => ', result.task);
    });
    exec.on('taskTimeout', (result) => {
        console.log('taskTimeout => ', result);
    });
    const tasks = [];
    for (let i = 1; i <= 60; i++) {
        const range = { min: 1, max: 5 };
        const priority = Math.floor(Math.random() * (range.max - range.min + 1) + range.min);
        tasks.push({ i: `${i}`, priority, timeout: i % 2 === 0 ? 800 : 1200 });
    }
    exec.doTasks(tasks);
    setTimeout(() => {
        exec.doTasks([
            { i: 'A', priority: 2 },
            { i: 'B', priority: 1 },
            { i: 'C', priority: 3 },
            { i: 'D', priority: 4 },
            { i: 'E', priority: 5 },
        ]);
    }, 5000);
};
//# sourceMappingURL=task-executor.js.map