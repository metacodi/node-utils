export declare const isMergeableObject: (value: any) => boolean;
export type KindOfType = 'primitive' | 'object' | 'array' | 'undefined' | 'function' | 'symbol' | 'special';
export type SpecialKindOfObject = 'Date' | 'RegExp' | 'moment';
export declare const getSpecialKindOfObject: (value: any) => SpecialKindOfObject;
export declare const getKindOfType: (value: any) => KindOfType;
export interface DeepMergeOptions {
    mergeInNewInstance?: boolean;
    arrayMerge?: ArrayMergeResolution;
    arrayCombine?: ArrayMergeFunctionType | undefined;
    copySourcePropertiesMissingOnTarget?: boolean;
    copyTargetPropertiesMissingOnSource?: boolean;
    supressEqualProperties?: boolean;
    propertyMerge?: PropertyMergeResolution;
    customMerge?: DeepMergeCustomFunctionType[];
    customClone?: DeepCloneCustomFunctionType[];
    customIsDifferent?: IsDifferentCustomFunctionType[];
    deepInPrototypes?: boolean;
    host?: any;
    isMergeableObject?: (value: any) => boolean;
}
export declare const defaultDeepMergeOptions: (options?: DeepMergeOptions) => DeepMergeOptions;
export type IsDifferentFunctionType = (target: any, source: any, options?: DeepMergeOptions) => boolean;
export type IsDifferentCustomFunctionType = (target: any, source: any, options?: DeepMergeOptions) => IsDifferentFunctionType | undefined;
export declare const isDifferent: IsDifferentFunctionType;
export type DeepCloneFunctionType = (value: any, options?: DeepMergeOptions, path?: (string | symbol)[]) => any;
export type DeepCloneCustomFunctionType = (value?: any, options?: DeepMergeOptions, path?: (string | symbol)[]) => DeepCloneFunctionType | undefined;
export declare const deepClone: DeepCloneFunctionType;
export declare const deepAssign: DeepMergeFunctionType;
export type DeepMergeFunctionType = (target: any, source: any, options?: DeepMergeOptions, path?: (string | symbol)[]) => any;
export type DeepMergeCustomFunctionType = (target?: any, source?: any, options?: DeepMergeOptions, path?: (string | symbol)[]) => DeepMergeFunctionType | undefined;
export declare const deepMerge: DeepMergeFunctionType;
export type ArrayMergeResolution = 'clone' | 'overwrite' | 'concat' | 'combine';
export type ArrayMergeFunctionType = (target: any[], source: any[], options?: DeepMergeOptions, path?: (string | symbol)[]) => any[];
export declare const defaultCombineArray: ArrayMergeFunctionType;
export type PropertyMergeResolution = 'merge' | 'preserve' | 'supress';
export declare const isPlainObject: (o: any) => boolean;
//# sourceMappingURL=deep-merge.d.ts.map