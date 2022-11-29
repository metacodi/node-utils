import { TaskExecutor, TaskExecutorOptions } from './task-executor';
export interface Logger extends TaskExecutor {
    log(text: string): void;
}
export declare type FileStampPeriod = 'annually' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'minutely';
export interface FileLoggerOptions extends TaskExecutorOptions {
    folder?: string;
    basename?: string;
    stamp?: {
        period?: FileStampPeriod;
        format?: string;
    };
    extension?: string;
}
export declare class FileLogger extends TaskExecutor implements Logger {
    folder: string;
    options?: FileLoggerOptions;
    constructor(folder: string, options?: FileLoggerOptions);
    get stamp(): string;
    log(text: string): void;
    protected executeTask(task: string): Promise<void>;
}
//# sourceMappingURL=file-logger.d.ts.map