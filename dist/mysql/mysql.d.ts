#!/usr/bin/env node
import { Pool, PoolConnection } from 'mysql2/promise';
export declare const convertToSql: (value: any) => string;
export declare const quoteEntityName: (entityName: string) => string;
export declare const interpolateQuery: (query: string, values?: {
    [param: string]: any;
}) => string;
export declare const syncRow: (conn: PoolConnection, table: string, row: any, primaryKey?: string) => Promise<any>;
export declare const getTableLastUpdate: (conn: PoolConnection | Pool, tableName: string) => Promise<string>;
//# sourceMappingURL=mysql.d.ts.map