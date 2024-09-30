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
exports.getTableAuditTimes = exports.getTableLastUpdate = exports.syncRow = exports.generateCrudStatements = exports.interpolateQuery = exports.convertToSql = exports.quoteEntityName = void 0;
const moment_1 = __importDefault(require("moment"));
const mysql = __importStar(require("mysql2"));
const quoteEntityName = (entityName) => { return entityName.startsWith('`') ? entityName : `\`${entityName}\``; };
exports.quoteEntityName = quoteEntityName;
const convertToSql = (value, options) => {
    if (!options) {
        options = {};
    }
    const scapeParamValues = options.scapeParamValues === undefined ? true : options.scapeParamValues;
    if (value instanceof Date && !isNaN(value)) {
        const date = (0, moment_1.default)(value).format('YYYY-MM-DD HH:mm:ss');
        return scapeParamValues ? mysql.escape(date) : date;
    }
    else if (value === undefined || value === null) {
        return 'null';
    }
    else if (typeof value === 'number') {
        return `${value}`;
    }
    else {
        return scapeParamValues ? mysql.escape(`${value}`) : `${value}`;
    }
};
exports.convertToSql = convertToSql;
const interpolateQuery = (query, params, options) => {
    if (!params || typeof params !== 'object')
        return query;
    if (!options) {
        options = {};
    }
    const stringifyParamValues = options.stringifyParamValues === undefined ? false : !!options.stringifyParamValues;
    const scapeParamValues = options.scapeParamValues === undefined || stringifyParamValues ? false : !!options.scapeParamValues;
    const interpolated = query.replace(/\:(\w+)/g, (txt, name) => params.hasOwnProperty(name) ?
        (stringifyParamValues ? (0, exports.convertToSql)(params[name], { scapeParamValues: true }) : (scapeParamValues ? mysql.escape(params[name]) : params[name])) : txt);
    return interpolated;
};
exports.interpolateQuery = interpolateQuery;
const generateCrudStatements = (table, row, options) => {
    if (!options) {
        options = {};
    }
    const primaryKey = options.primaryKey === undefined ? 'idreg' : options.primaryKey;
    const prefixFieldsWithTable = options.prefixFieldsWithTable === undefined ? false : options.prefixFieldsWithTable;
    const selectWithAsterik = options.selectWithAsterik === undefined ? false : options.selectWithAsterik;
    const quoteField = (table, field) => prefixFieldsWithTable ? `${(0, exports.quoteEntityName)(table)}.${(0, exports.quoteEntityName)(field)}` : (0, exports.quoteEntityName)(field);
    table = (0, exports.quoteEntityName)(table);
    const pk = quoteField(table, primaryKey);
    const idreg = row[primaryKey];
    const fields = [];
    const columns = [];
    const params = [];
    const pairs = [];
    const values = {};
    for (const field of Object.keys(row)) {
        fields.push((0, exports.quoteEntityName)(field));
        columns.push(quoteField(table, field));
        params.push(`:${field}`);
        pairs.push(`${quoteField(table, field)} = :${field}`);
        values[field] = (0, exports.convertToSql)(row[field], { scapeParamValues: true });
    }
    const parameterized = {
        select: `SELECT ${selectWithAsterik ? '*' : columns.join(', ')} FROM ${table}`,
        insert: `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${params.join(', ')})`,
        update: `UPDATE ${table} SET ${pairs.join(', ')} WHERE ${pk} = ${idreg}`,
        delete: `DELETE FROM ${table}`,
    };
    const interpolated = {
        select: `SELECT ${selectWithAsterik ? '*' : columns.join(', ')} FROM ${table} WHERE ${pk} = ${idreg}`,
        insert: (0, exports.interpolateQuery)(parameterized.insert, values, { scapeParamValues: false }),
        update: (0, exports.interpolateQuery)(parameterized.update, values, { scapeParamValues: false }),
        delete: `DELETE FROM ${table} ${table} WHERE ${pk} = ${idreg}`,
    };
    const tokens = { table, fields, columns, params, pairs, values, primaryKey: pk, idreg };
    return { parameterized, interpolated, tokens };
};
exports.generateCrudStatements = generateCrudStatements;
const syncRow = (conn, table, row, options) => __awaiter(void 0, void 0, void 0, function* () {
    const crud = (0, exports.generateCrudStatements)(table, row, options);
    const { select, insert, update } = crud.interpolated;
    const [rows] = yield conn.query(select);
    const result = Array.isArray(rows) ? rows : [rows];
    const query = result.length ? update : insert;
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