import moment from 'moment';
export declare const timestamp: (inp?: moment.MomentInput) => string;
export declare const logTime: (message?: any, ...optionalParams: any[]) => void;
export declare function round(value: number, decimals?: number): number;
export declare function capitalize(text: string): string;
export interface ErrorObject {
    code?: number;
    message: string;
    data?: any;
}
export declare const concatError: (error: any, message: string) => ErrorObject;
export declare const getErrorMessage: (error: any) => string;
export declare const getErrorObject: (error: any) => ErrorObject;
export declare type FilterPatternType = string | RegExp | ((text: string) => boolean) | {
    test: RegExp | ((text: string) => boolean);
};
export declare function applyFilterPattern(text: string, pattern?: FilterPatternType): boolean;
export declare const upgradePatchVersion: (version: string) => string;
export declare const upgradeMinorVersion: (version: string) => string;
export declare const upgradeMajorVersion: (version: string) => string;
export declare const incrementPackageVersion: (level?: 'major' | 'minor' | 'patch') => string;
export declare const upgradeDependency: (packageName: string, type?: '--save-dev' | '--save-prod' | '--save-peer' | '-D') => Promise<void>;
//# sourceMappingURL=functions.d.ts.map