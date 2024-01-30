import { TaskExecutor, TaskExecutorOptions } from './task-executor';
export declare type FilePeriodStamp = 'annually' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'minutely';
export interface Logger extends TaskExecutor {
    log(text: string): void;
}
export interface FileLoggerOptions extends TaskExecutorOptions {
    folder?: string;
    basename?: string;
    formatStamp?: string;
    periodStamp?: FilePeriodStamp;
    extension?: string;
}
export declare class FileLogger extends TaskExecutor implements Logger {
    options?: FileLoggerOptions;
    constructor(options?: FileLoggerOptions);
    get folder(): string;
    get basename(): string;
    get formatStamp(): string;
    get periodStamp(): string;
    get extension(): string;
    get filename(): string;
    get fullname(): string;
    get stamp(): string;
    log(text: string): void;
    protected executeTask(content: string): Promise<void>;
}
//# sourceMappingURL=file-logger.d.ts.map