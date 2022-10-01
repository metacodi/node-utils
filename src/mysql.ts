#!/usr/bin/env node
import chalk from 'chalk';
import Prompt from 'commander';
import moment from 'moment';
import * as mysql from 'mysql2';
import { Pool, PoolConnection } from 'mysql2/promise';


/** Converteix un valor per utilitzar en una sentència sql. */
export const convertToSql = (value: any): string => { return value instanceof Date && !isNaN(value as any) ? moment(value).format('YYYY-MM-DD HH:mm:ss') : `${value}`; }

/** Retorna el nom de l'entitat (taula, camp, funció) encerclat amb comes inclinades. */
export const quoteEntityName = (entityName: string): string => { return entityName.startsWith('`') ? entityName : `\`${entityName}\``; }

/** Substitueix els paràmetres amb nom d'una consulta parametritzada pels valors corresponents. */
export const interpolateQuery = (query: string, values?: { [param: string]: any }): string => {
  if (!values) return query;
  return query.replace(/\:(\w+)/g, (txt, param) => {
    if (values.hasOwnProperty(param)) {
      return mysql.escape(values[param]);
    }
    return txt;
  });
}

/**
 * Actualitza la fila de la taula a través de la connexió indicada amb la informació de la fila donada.
 *
 * @param primaryKey Nom de la columna de la clau primària. default `idreg`.
 * @returns Una estructura de dades amb la informació dels canvis realitzats.
 */
export const syncRow = async (conn: PoolConnection, table: string, row: any, primaryKey?: string): Promise<any> => {
  table = quoteEntityName(table);
  primaryKey = primaryKey || 'idreg';
  const pk = quoteEntityName(primaryKey);
  const idreg = row[primaryKey];

  // Obtenim la fila que volem actualitzar.
  const [ rows ] = await conn.query(`SELECT * FROM ${table} WHERE ${pk} = ${idreg}`);
  const result = Array.isArray(rows) ? rows as any[] : [rows];

  const fields: string[] = [];
  const params: string[] = [];
  const pairs: string[] = [];
  // const values: any[] = [];
  const values: { [param: string]: any } = {};

  for (const field of Object.keys(row)) {
    fields.push(quoteEntityName(field));
    params.push(`:${field}`);
    pairs.push(`${quoteEntityName(field)} = :${field}`);
    // values.push(convertToSql(row[field]));
    values[field] = convertToSql(row[field]);
  }

  const sql = result.length ?
    `UPDATE ${table} SET ${pairs.join(', ')} WHERE ${pk} = ${idreg}` :
    `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${params.join(', ')});`
  ;

  // Insertem o actualitzem la fila de destí.
  const query = interpolateQuery(sql, values);
  // if (Prompt.verbose) { console.log(chalk.blueBright(query)); }
  return await conn.query(query);
}

/** Retorna la data de l'última actualització d'una taula. */
export const getTableLastUpdate = async (conn: PoolConnection | Pool, tableName: string): Promise<string> => {
  const [rows] = await conn.query(`SELECT UPDATE_TIME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}'`);
  const result = Array.isArray(rows) ? rows as any[] : [rows];
  return Promise.resolve(result.length ? moment(result[0].UPDATE_TIME).format('YYYY-MM-DD HH:mm:ss') : undefined);
}
