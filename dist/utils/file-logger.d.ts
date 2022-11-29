import { TaskExecutor } from './task-executor';
export interface Logger extends TaskExecutor {
    log(text: string): void;
}
export declare class FileLogger extends TaskExecutor implements Logger {
    folder: string;
    logPeriod: 'annually' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'minutely';
    fileOptions?: {
        basename?: string;
        extension?: string;
    };
    constructor(folder: string, logPeriod: 'annually' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'minutely', fileOptions?: {
        basename?: string;
        extension?: string;
    });
    get stamp(): string;
    log(text: string): void;
    protected executeTask(task: string): Promise<void>;
}
//# sourceMappingURL=file-logger.d.ts.map