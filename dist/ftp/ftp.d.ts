/// <reference types="node" />
import Client from 'ftp';
import { FilterPatternType } from '../functions/functions';
export interface FtpUploadOptions {
    continueOnError?: boolean;
    verbose?: boolean;
    ignore?: string | RegExp;
    filter?: string | RegExp;
}
export declare class FtpClient {
    protected ftp: Client;
    protected options: Client.Options;
    protected isReady: boolean;
    constructor(options?: Client.Options);
    connect(connection?: Client.Options): void;
    disconnect(): void;
    ready(): Promise<boolean>;
    get status(): Promise<string>;
    get host(): string;
    get user(): string;
    get password(): string;
    get port(): number;
    get defaultOptions(): Partial<Client.Options>;
    upload(local: string, remote: string, options?: {
        continueOnError?: boolean;
        verbose?: boolean;
        ignore?: string | RegExp;
        filter?: string | RegExp;
    }): Promise<void>;
    private uploadAll;
    download(remote: string, local: string, options?: {
        continueOnError?: boolean;
        verbose?: boolean;
        ignore?: FilterPatternType;
        filter?: FilterPatternType;
    }): Promise<void>;
    private downloadAll;
    remove(remote: string, options?: {
        continueOnError?: boolean;
        verbose?: boolean;
        ignore?: string | RegExp;
        filter?: string | RegExp;
    }): Promise<void>;
    private removeAll;
    mkdir(remote: string, recursive?: boolean): Promise<boolean>;
    rmdir(remote: string, recursive: boolean, options?: {
        continueOnError?: boolean;
    }): Promise<boolean>;
    get(remote: string): Promise<NodeJS.ReadableStream>;
    put(local: string, remote: string): Promise<boolean>;
    delete(remote: string): Promise<boolean>;
    list(remote?: string): Promise<Client.ListingElement[]>;
    pwd(): Promise<string>;
    abort(): Promise<void>;
    ascii(): Promise<void>;
    binary(): Promise<void>;
    normalizeRemote(resource: string): string;
    isRemoteDirectory(el: Client.ListingElement): boolean;
    isRemoteFile(el: Client.ListingElement): boolean;
    isLocalDirectory(resource: string): boolean;
    isLocalFile(resource: string): boolean;
}
//# sourceMappingURL=ftp.d.ts.map