#!/usr/bin/env node
import { Connection, Pool, PoolConnection } from 'mysql2/promise';
export declare const quoteEntityName: (entityName: string) => string;
export declare const convertToSql: (value: any, options?: {
    scapeParamValues?: boolean;
}) => string;
export declare const interpolateQuery: (query: string, params: {
    [param: string]: any;
}, options?: {
    stringifyParamValues?: boolean;
    scapeParamValues?: boolean;
}) => string;
export declare const generateCrudStatements: (table: string, row: any, options?: {
    primaryKey?: string;
    prefixFieldsWithTable?: boolean;
    selectWithAsterik?: boolean;
}) => {
    parameterized: {
        select: string;
        insert: string;
        update: string;
        delete: string;
    };
    interpolated: {
        select: string;
        insert: string;
        update: string;
        delete: string;
    };
    tokens: {
        table: string;
        fields: string[];
        columns: string[];
        params: string[];
        pairs: string[];
        values: {
            [param: string]: any;
        };
        primaryKey: string;
        idreg: any;
    };
};
export declare const syncRow: (conn: Connection | PoolConnection, table: string, row: any, options?: {
    primaryKey?: string;
    prefixFieldsWithTable?: boolean;
    selectWithAsterik?: boolean;
}) => Promise<any>;
export declare const getTableLastUpdate: (conn: Connection | PoolConnection | Pool, tableName: string) => Promise<string>;
export declare const getTableAuditTimes: (conn: Connection | PoolConnection | Pool, tableName: string) => Promise<{
    created: string;
    updated: string;
}>;
//# sourceMappingURL=mysql.d.ts.map