#!/usr/bin/env node
import mysql from 'mysql2';
import { Connection, Pool, PoolConnection } from 'mysql2/promise';
import moment from 'moment';


/** Retorna el nom de l'entitat (taula, camp, funció) encerclat amb comes inclinades. */
export const quoteEntityName = (entityName: string): string => { return entityName.startsWith('`') ? entityName : `\`${entityName}\``; }

/** Converteix un valor per utilitzar en una sentència sql. */
export const convertToSql = (value: any, options?: { scapeParamValues?: boolean; }): string => {
  // return value instanceof Date && !isNaN(value as any) ? moment(value).format('YYYY-MM-DD HH:mm:ss') : `${value}`;
  if (!options) { options = {}; }
  const scapeParamValues = options.scapeParamValues === undefined ? true : options.scapeParamValues;

  if (value instanceof Date && !isNaN(value as any)) {
    const date = moment(value).format('YYYY-MM-DD HH:mm:ss');
    return scapeParamValues ? mysql.escape(date) : date;

  } else if (value === undefined || value === null) {
    return 'null';

  } else if (typeof value === 'number') {
    return `${value}`;

  } else {
    return scapeParamValues ? mysql.escape(`${value}`) : `${value}`;
  }
}

/** Substitueix els paràmetres amb nom d'una consulta parametritzada pels valors corresponents.
 * 
 * @param stringifyParamValues Indica si s'utilitzarà la funció `convertToSql()` per obtenir els valors dels paràmetres com a text sql vàlid. S'utilitza quan es passen uns params en brut, com per exemple una fila de dades on hi ha valors numèrics o nulls. Default `false`.
 * @param scapeParamValues Indica si els valors dels paràmetres s'escaparan entre cometes. Aquesta opció queda deshabilitada quan `stringifyParamsValues` s'estableix a `true`. Default `false`.
 */
export const interpolateQuery = (query: string, params: { [param: string]: any }, options?: { stringifyParamValues?: boolean; scapeParamValues?: boolean; }): string => {
  if (!params || typeof params !== 'object') return query;
  if (!options) { options = {}; }
  const stringifyParamValues = options.stringifyParamValues === undefined ? false : !!options.stringifyParamValues;
  const scapeParamValues = options.scapeParamValues === undefined || stringifyParamValues ? false : !!options.scapeParamValues;
  const interpolated = query.replace(/\:(\w+)/g, (txt, name) => params.hasOwnProperty(name) ? 
    (stringifyParamValues ? convertToSql(params[name], { scapeParamValues: true }) : (scapeParamValues ? mysql.escape(params[name]) : params[name])) : txt
  );
  return interpolated;
}

/** Genera les sentències sql amb paràmetres i interpolades a partir de la fila suministrada.
 * 
 * @param primaryKey Nom de la columna de la clau primària. default `idreg`.
 * @param prefixFieldsWithTable Indica si s'afegirà el nom de la taula davant del camp. default `false`.
 * @param selectWithAsterik Indica si a la sentència select s'utilitzarà un asterisk '*' enlloc d'una llista de les columnes de la taula. default `false`.
 * @returns 
 * ```typescript
 * {
 *   parameterized: {
 *     select: "SELECT * FROM `clientes`",
 *     insert: "INSERT INTO `clientes` (`idreg`, `idUser`, `idEmpresa`, `idProveedor`, `idPayment`, `autoAutorizar`, `created`, `updated`, `deleted`) VALUES (:idreg, :idUser, :idEmpresa, :idProveedor, :idPayment, :autoAutorizar, :created, :updated, :deleted)",
 *     update: "UPDATE `clientes` SET `clientes`.`idreg` = :idreg, `clientes`.`idUser` = :idUser, `clientes`.`idEmpresa` = :idEmpresa, `clientes`.`idProveedor` = :idProveedor, `clientes`.`idPayment` = :idPayment, `clientes`.`autoAutorizar` = :autoAutorizar, `clientes`.`created` = :created, `clientes`.`updated` = :updated, `clientes`.`deleted` = :deleted WHERE `clientes`.`idreg` = 11575",
 *     delete: "DELETE FROM `clientes`",
 *   }
 *   interpolated: {
 *     select: "SELECT * FROM `clientes` WHERE `clientes`.`idreg` = 11575",
 *     insert: "INSERT INTO `clientes` (`idreg`, `idUser`, `idEmpresa`, `idProveedor`, `idPayment`, `autoAutorizar`, `created`, `updated`, `deleted`) VALUES (11575, 11583, null, 100, null, 0, '2024-04-30 16:20:28', '2024-04-30 16:20:28', null)",
 *     update: "UPDATE `clientes` SET `clientes`.`idreg` = 11575, `clientes`.`idUser` = 11583, `clientes`.`idEmpresa` = null, `clientes`.`idProveedor` = 100, `clientes`.`idPayment` = null, `clientes`.`autoAutorizar` = 0, `clientes`.`created` = '2024-04-30 16:20:28', `clientes`.`updated` = '2024-04-30 16:20:28', `clientes`.`deleted` = null WHERE `clientes`.`idreg` = 11575",
 *     delete: "DELETE FROM `clientes` `clientes` WHERE `clientes`.`idreg` = 11575",
 *   },
 *   tokens: {
 *     table: "`clientes`",
 *     fields: [
 *       "`idreg`",
 *       "`idUser`",
 *       "`idEmpresa`",
 *       "`idProveedor`",
 *       "`idPayment`",
 *       "`autoAutorizar`",
 *       "`created`",
 *       "`updated`",
 *       "`deleted`",
 *     ],
 *     columns: [
 *       "`clientes`.`idreg`",
 *       "`clientes`.`idUser`",
 *       "`clientes`.`idEmpresa`",
 *       "`clientes`.`idProveedor`",
 *       "`clientes`.`idPayment`",
 *       "`clientes`.`autoAutorizar`",
 *       "`clientes`.`created`",
 *       "`clientes`.`updated`",
 *       "`clientes`.`deleted`",
 *     ],
 *     params: [
 *       ":idreg",
 *       ":idUser",
 *       ":idEmpresa",
 *       ":idProveedor",
 *       ":idPayment",
 *       ":autoAutorizar",
 *       ":created",
 *       ":updated",
 *       ":deleted",
 *     ],
 *     pairs: [
 *       "`clientes`.`idreg` = :idreg",
 *       "`clientes`.`idUser` = :idUser",
 *       "`clientes`.`idEmpresa` = :idEmpresa",
 *       "`clientes`.`idProveedor` = :idProveedor",
 *       "`clientes`.`idPayment` = :idPayment",
 *       "`clientes`.`autoAutorizar` = :autoAutorizar",
 *       "`clientes`.`created` = :created",
 *       "`clientes`.`updated` = :updated",
 *       "`clientes`.`deleted` = :deleted",
 *     ],
 *     values: {
 *       idreg: "11575",
 *       idUser: "11583",
 *       idEmpresa: "null",
 *       idProveedor: "100",
 *       idPayment: "null",
 *       autoAutorizar: "0",
 *       created: "'2024-04-30 16:20:28'",
 *       updated: "'2024-04-30 16:20:28'",
 *       deleted: "null",
 *     },
 *     primaryKey: "`clientes`.`idreg`",
 *     idreg: 11575,
 *   }
 * ```
 */
export const generateCrudStatements = (table: string, row: any, options?: { primaryKey?: string; prefixFieldsWithTable?: boolean; selectWithAsterik?: boolean }) => {
  if (!options) { options = {}; }
  const primaryKey = options.primaryKey === undefined ? 'idreg' : options.primaryKey;
  const prefixFieldsWithTable = options.prefixFieldsWithTable === undefined ? false : options.prefixFieldsWithTable;
  const selectWithAsterik = options.selectWithAsterik === undefined ? false : options.selectWithAsterik;
  const quoteField = (table: string, field: string): string => prefixFieldsWithTable ? `${quoteEntityName(table)}.${quoteEntityName(field)}` : quoteEntityName(field);

  table = quoteEntityName(table);
  const pk = quoteField(table, primaryKey);
  const idreg = row[primaryKey];

  const fields: string[] = [];
  const columns: string[] = [];
  const params: string[] = [];
  const pairs: string[] = [];
  const values: { [param: string]: any } = {};

  for (const field of Object.keys(row)) {
    fields.push(quoteEntityName(field));
    columns.push(quoteField(table, field));
    params.push(`:${field}`);
    pairs.push(`${quoteField(table, field)} = :${field}`);
    // NOTA: Escapem els valors pels paràmetres abans de la interpolació.
    values[field] = convertToSql(row[field], { scapeParamValues: true });
  }

  const parameterized = {
    select: `SELECT ${selectWithAsterik ? '*' : columns.join(', ')} FROM ${table}`,
    insert: `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${params.join(', ')})`,
    update: `UPDATE ${table} SET ${pairs.join(', ')} WHERE ${pk} = ${idreg}`,
    delete: `DELETE FROM ${table}`,
  };

  const interpolated = {
    select: `SELECT ${selectWithAsterik ? '*' : columns.join(', ')} FROM ${table} WHERE ${pk} = ${idreg}`,
    insert: interpolateQuery(parameterized.insert, values, { scapeParamValues: false }),
    update: interpolateQuery(parameterized.update, values, { scapeParamValues: false }),
    delete: `DELETE FROM ${table} ${table} WHERE ${pk} = ${idreg}`,
  };

  const tokens = { table, fields, columns, params, pairs, values, primaryKey: pk, idreg };

  return { parameterized, interpolated, tokens };
}

/** Actualitza la fila de la taula a través de la connexió indicada amb la informació de la fila donada.
 *
 * @param primaryKey Nom de la columna de la clau primària. @default `idreg`.
 * @param prefixFieldsWithTable Indica si s'afegirà el nom de la taula davant del camp. @default false
 * @param selectWithAsterik Indica si a la sentència select s'utilitzarà un asterisk '*' enlloc d'una llista de les columnes de la taula. @default false.
 * @returns Una estructura de dades amb la informació dels canvis realitzats.
 */
export const syncRow = async (conn: Connection | PoolConnection, table: string, row: any, options?: { primaryKey?: string; prefixFieldsWithTable?: boolean; selectWithAsterik?: boolean }): Promise<any> => {
  // Obtenim les sentències SQL per la fila actual.
  const crud = generateCrudStatements(table, row, options);
  const { select, insert, update } = crud.interpolated;

  // Comprovem si la fila que volem actualitzar existeix.
  const [ rows ] = await conn.query(select);
  const result = Array.isArray(rows) ? rows as any[] : [rows];

  const query = result.length ? update : insert;
  // if (Prompt.verbose) { console.log(chalk.blueBright(query)); }
  return await conn.query(query);
}

/** Retorna la data de l'última actualització de la taula indicada. */
export const getTableLastUpdate = async (conn: Connection | PoolConnection | Pool, tableName: string): Promise<string> => {
  // const conn: Connection
  const [rows] = await conn.query(`SELECT UPDATE_TIME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}'`);
  const result = Array.isArray(rows) ? rows as any[] : [rows];
  return Promise.resolve(result.length ? moment(result[0].UPDATE_TIME).format('YYYY-MM-DD HH:mm:ss') : undefined);
}

/** Retorna les dates de la darrera creació i actualització de la taula indicada. */
export const getTableAuditTimes = async (conn: Connection | PoolConnection | Pool, tableName: string): Promise<{ created: string, updated: string }> => {
  const [rows] = await conn.query(`SELECT CREATE_TIME, UPDATE_TIME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}'`);
  const result = Array.isArray(rows) ? rows as any[] : [rows];
  if (result.length) {
    const response = {
      created: moment(result[0].CREATE_TIME).format('YYYY-MM-DD HH:mm:ss'),
      updated: moment(result[0].UPDATE_TIME).format('YYYY-MM-DD HH:mm:ss'),
    };
    return response;
  } else {
    return undefined;

  }
}
