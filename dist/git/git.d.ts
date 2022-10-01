import { TerminalRunOptions } from '../terminal/terminal';
export declare class Git {
    constructor();
    static hasChanges(options?: {
        folder?: string;
        filter?: string;
        verbose?: boolean;
    }): Promise<boolean>;
    static getPendingChanges(options?: {
        folder?: string;
        filter?: string;
        verbose?: boolean;
    }): Promise<{
        filename: string;
        status: string;
    }[]>;
    static getChangesSince(date: string, options?: {
        folder?: string;
        filter?: string;
        verbose?: boolean;
    }): Promise<{
        filename: string;
        status: string;
    }[]>;
    static getCommitChanges(head: string, options?: {
        folder?: string;
        filter?: string;
        verbose?: boolean;
    }): Promise<{
        filename: string;
        status: string;
    }[]>;
    static discardChanges(resource?: string): Promise<any>;
    static publish(options?: {
        folder?: string;
        commit?: string;
        branch?: string;
        run?: TerminalRunOptions;
    }): Promise<boolean>;
    static codeToStatus(code: string): string | undefined;
    foo(): string;
}
//# sourceMappingURL=git.d.ts.map