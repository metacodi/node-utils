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
    maxTasksInPeriod?: number;
    maxTasksCheckingPeriod?: number;
}
export declare abstract class TaskExecutor {
    options?: TaskExecutorOptions;
    private queue;
    isExecutingTask: boolean;
    currentTask: any;
    isSleeping: boolean;
    isExecutionPaused: boolean;
    changeLimitsPending: boolean;
    executedTasksInPeriod: number;
    private maxTasksCheckingSubscription;
    constructor(options?: TaskExecutorOptions);
    do(task: any): void;
    doTask(task: any): void;
    doTasks(tasks: any[]): void;
    protected executeQueue(): void;
    protected abstract executeTask(task: any): Promise<any>;
    pauseQueue(): void;
    resumeQueue(): void;
    protected nextTask(): void;
    protected startMaxTasksCheckingInterval(): void;
    protected stopMaxTasksCheckingInterval(): void;
    protected sleepMaxTasksCheckingInterval(period?: number): void;
    protected processMaxTasksCheckingInterval(): void;
    protected get isMaxTaskCheckingStarted(): boolean;
    getTasks(options?: {
        includeCurrentTask?: boolean;
        cloneTasks?: boolean;
    }): any[];
    protected addTask(task: any): void;
    protected consumeTask(): any;
    protected restoreTask(task: any): any;
    protected get hasTasksToConsume(): boolean;
    protected sortTasksByPriority(): void;
    protected get hasPriority(): boolean;
    get run(): 'sync' | 'async';
    get add(): 'unshift' | 'push';
    get consume(): 'shift' | 'pop';
    get delay(): number;
    get maxTasksCheckingPeriod(): number;
    get maxTasksInPeriod(): number;
}
//# sourceMappingURL=task-executor.d.ts.map