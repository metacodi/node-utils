/// <reference types="node" />
import EventEmitter from 'events';
import moment from 'moment';
export interface Interval {
    period: number;
    unitOfTime?: moment.unitOfTime.DurationAs;
}
export interface TaskExecutorOptions {
    add?: 'unshift' | 'push';
    consume?: 'shift' | 'pop';
    run?: 'sync' | 'async';
    delay?: number;
    timeoutTaskPeriod?: number;
    maxTasksInPeriod?: number;
    maxTasksCheckingPeriod?: number;
}
export interface TaskType {
    priority?: number;
    timeout?: number;
}
export interface TaskResult<T extends TaskType | string> {
    task: T;
    started?: string;
    ended?: string;
    error?: any;
}
export declare abstract class TaskExecutor<T extends TaskType | string> extends EventEmitter {
    options?: TaskExecutorOptions;
    private queue;
    isExecutingTask: boolean;
    currentTask: T;
    history: TaskResult<T>[];
    isSleeping: boolean;
    isExecutionPaused: boolean;
    changeLimitsPending: boolean;
    executedTasksInPeriod: number;
    constructor(options?: TaskExecutorOptions);
    do(task: T): void;
    doTask(task: T): void;
    doTasks(tasks: T[]): void;
    protected executeQueue(): void;
    protected abstract executeTask(task: T): Promise<T>;
    pauseQueue(): void;
    resumeQueue(): void;
    protected nextTask(): void;
    private maxTasksCheckingSubscription;
    protected startMaxTasksCheckingInterval(): void;
    protected stopMaxTasksCheckingInterval(): void;
    protected sleepMaxTasksCheckingInterval(period?: number): void;
    protected processMaxTasksCheckingInterval(): void;
    protected get isMaxTaskCheckingStarted(): boolean;
    getTasks(options?: {
        includeCurrentTask?: boolean;
        cloneTasks?: boolean;
    }): T[];
    protected addTask(task: T): void;
    protected consumeTask(): T;
    protected restoreTask(task: T): number;
    protected get hasTasksToConsume(): boolean;
    protected sortTasksByPriority(): void;
    protected get hasPriority(): boolean;
    get run(): 'sync' | 'async';
    get add(): 'unshift' | 'push';
    get consume(): 'shift' | 'pop';
    get delay(): number;
    get timeoutTaskPeriod(): number;
    get maxTasksCheckingPeriod(): number;
    get maxTasksInPeriod(): number;
}
//# sourceMappingURL=task-executor.d.ts.map