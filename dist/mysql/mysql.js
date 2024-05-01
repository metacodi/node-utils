#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTableAuditTimes = exports.getTableLastUpdate = exports.syncRow = exports.interpolateQuery = exports.quoteEntityName = exports.convertToSql = void 0;
const moment_1 = __importDefault(require("moment"));
const mysql = __importStar(require("mysql2"));
const convertToSql = (value) => { return value instanceof Date && !isNaN(value) ? (0, moment_1.default)(value).format('YYYY-MM-DD HH:mm:ss') : `${value}`; };
exports.convertToSql = convertToSql;
const quoteEntityName = (entityName) => { return entityName.startsWith('`') ? entityName : `\`${entityName}\``; };
exports.quoteEntityName = quoteEntityName;
const interpolateQuery = (query, values) => {
    if (!values)
        return query;
    return query.replace(/\:(\w+)/g, (txt, param) => {
        if (values.hasOwnProperty(param)) {
            return mysql.escape(values[param]);
        }
        return txt;
    });
};
exports.interpolateQuery = interpolateQuery;
const syncRow = (conn, table, row, primaryKey) => __awaiter(void 0, void 0, void 0, function* () {
    table = (0, exports.quoteEntityName)(table);
    primaryKey = primaryKey || 'idreg';
    const pk = (0, exports.quoteEntityName)(primaryKey);
    const idreg = row[primaryKey];
    const [rows] = yield conn.query(`SELECT * FROM ${table} WHERE ${pk} = ${idreg}`);
    const result = Array.isArray(rows) ? rows : [rows];
    const fields = [];
    const params = [];
    const pairs = [];
    const values = {};
    for (const field of Object.keys(row)) {
        fields.push((0, exports.quoteEntityName)(field));
        params.push(`:${field}`);
        pairs.push(`${(0, exports.quoteEntityName)(field)} = :${field}`);
        values[field] = (0, exports.convertToSql)(row[field]);
    }
    const sql = result.length ?
        `UPDATE ${table} SET ${pairs.join(', ')} WHERE ${pk} = ${idreg}` :
        `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${params.join(', ')});`;
    const query = (0, exports.interpolateQuery)(sql, values);
    return yield conn.query(query);
});
exports.syncRow = syncRow;
const getTableLastUpdate = (conn, tableName) => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield conn.query(`SELECT UPDATE_TIME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}'`);
    const result = Array.isArray(rows) ? rows : [rows];
    return Promise.resolve(result.length ? (0, moment_1.default)(result[0].UPDATE_TIME).format('YYYY-MM-DD HH:mm:ss') : undefined);
});
exports.getTableLastUpdate = getTableLastUpdate;
const getTableAuditTimes = (conn, tableName) => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield conn.query(`SELECT CREATE_TIME, UPDATE_TIME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}'`);
    const result = Array.isArray(rows) ? rows : [rows];
    if (result.length) {
        const response = {
            created: (0, moment_1.default)(result[0].CREATE_TIME).format('YYYY-MM-DD HH:mm:ss'),
            updated: (0, moment_1.default)(result[0].UPDATE_TIME).format('YYYY-MM-DD HH:mm:ss'),
        };
        return response;
    }
    else {
        return undefined;
    }
});
exports.getTableAuditTimes = getTableAuditTimes;
//# sourceMappingURL=mysql.js.map