import moment from 'moment';


// ---------------------------------------------------------------------------------------------------
//  isMergeableObject
// ---------------------------------------------------------------------------------------------------

export const isMergeableObject = (value: any): boolean => isNonNullObject(value) && !isSpecialObject(value);

const isNonNullObject = (value: any): boolean => !!value && typeof value === 'object';

/** {@link https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25 } */
const canUseSymbol = typeof Symbol === 'function' && Symbol.for;
const REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;
const isReactElement = (value: any): boolean => value.$$typeof === REACT_ELEMENT_TYPE;


// ---------------------------------------------------------------------------------------------------
//  KindOfType . getKindOfType
// ---------------------------------------------------------------------------------------------------

/**
 * Indica el tipo de valor de una propiedad o variable.
 *
 * ```typescript
 * getKindOfType(value: any) => KindOfType
 * ```
 *
 * - **primitive**: incluye los tipos `string`, `number`, `boolean`, 'null' y `bigint`.
 * - **object**: cualquier tipo que sea `typeof === 'object'`, excepto `null`, `array`, `Date` y `RegExp` que se tratan deliveradamente aparte.
 * - **array**: tratamos `[object Array]` como un caso particular aparte del tipo 'object'.
 * - **special**: tratamos `[object Date]`, `[object RegExp]` y `moment.Moment`.
 */
export type KindOfType = 'primitive' | 'object' | 'array' | 'undefined' | 'function' | 'symbol' | 'special';

export type SpecialKindOfObject = 'Date' | 'RegExp' | 'moment';

const isSpecialObject = (value: any): boolean => {
  try {
    const kind = getSpecialKindOfObject(value);
    return true;
  } catch (err: any) {
    return false;
  }
};

export const getSpecialKindOfObject = (value: any): SpecialKindOfObject => {
  if (moment.isMoment(value)) { return 'moment'; }
  const objKind = Object.prototype.toString.call(value);
  switch (objKind) {
    case '[object Date]': return 'Date';
    case '[object RegExp]': return 'RegExp';
    default:
      throw new Error(`Unknown special kind of object '${objKind}'.`);
  }
};

/** Devuelve el tipo de datos `KindOfType` del valor. */
export const getKindOfType = (value: any): KindOfType => {
  switch (typeof value) {
    case 'bigint': return 'primitive';
    case 'boolean': return 'primitive';
    case 'function': return 'function';
    case 'number': return 'primitive';
    case 'object':
      if (isSpecialObject(value)) { return 'special'; }
      const objKind = Object.prototype.toString.call(value);
      switch (objKind) {
        case '[object Array]': return 'array';
        case '[object Null]': return 'primitive';
        case '[object Object]': return 'object';
        default:
          console.warn(`Unknown kind of object '${objKind}'.`);
          return 'object';
      }
    case 'string': return 'primitive';
    case 'symbol': return 'symbol';
    case 'undefined': return 'undefined';
    default:
      throw new Error(`Unknown kind of type '${typeof value}'`);
  }
};


// ---------------------------------------------------------------------------------------------------
//  DeepMergeOptions
// ---------------------------------------------------------------------------------------------------

/** Describe las opciones para proceder durante una operación de mezcla. */
export interface DeepMergeOptions {
  /** Indica si la mezcla se realizará directamente sobre el destino (_target_) o bien si se creará una nueva instancia diferente. @default true */
  mergeInNewInstance?: boolean;
  /** Indica como proceder cuando hay que mezclar dos arrays. @default 'combine' */
  arrayMerge?: ArrayMergeResolution;
  /** Cuando arrayMerge se establece en `combine`, indica la función personalizada se quiere utilizar en lugar de la función por defecto `defaultCombineArray`. */
  arrayCombine?: ArrayMergeFunctionType | undefined;
  /** Incluye en el resultado las propiedades de la fuente (_source_) que no estén presentes en el destino (_target_). @default true */
  copySourcePropertiesMissingOnTarget?: boolean;
  /** Incluye en el resultado las propiedades del destino (_target_) que no estén presentes en la fuente (_source_). @default true */
  copyTargetPropertiesMissingOnSource?: boolean;
  /** Excluye del resultado las propiedades con mismo nombre y valor. @default false */
  supressEqualProperties?: boolean;
  /** Indica como proceder cuando hay que mezclar los propiedades. @default 'merge' */
  propertyMerge?: PropertyMergeResolution;
  /** Permite establecer una función personalizada para realizar el merge de un objeto o devolver `undefined` (si se desea utilizar la función por defecto `mergeObject`). */
  customMerge?: DeepMergeCustomFunctionType[];
  /** Permite establecer una función personalizada para la clonación.  */
  customClone?: DeepCloneCustomFunctionType[];
  /** Permite establecer una función personalizada para comprobar si dos valores son diferentes. */
  customIsDifferent?: IsDifferentCustomFunctionType[];
  /** TODO: Indica si la copia de propiedades debe incluir también las propiedades de los prototipos. @default false */
  deepInPrototypes?: boolean;
  /** Referencia al objeto de destino. */
  host?: any;
  /** Indica cuando el valor es mezclable. */
  isMergeableObject?: (value: any) => boolean;
}

/** Devuelve un conjunto de opciones de mezcla por defecto. */
export const defaultDeepMergeOptions = (options?: DeepMergeOptions): DeepMergeOptions => {
  if (!options) { options = {}; }
  const def: DeepMergeOptions = {};
  def.mergeInNewInstance = options.mergeInNewInstance === undefined ? true : options.mergeInNewInstance;
  def.arrayMerge = options.arrayMerge === undefined ? 'combine' : options.arrayMerge;
  def.arrayCombine = options.arrayCombine === undefined ? defaultCombineArray : options.arrayCombine;
  def.copySourcePropertiesMissingOnTarget = options.copySourcePropertiesMissingOnTarget === undefined ? true : options.copySourcePropertiesMissingOnTarget;
  def.copyTargetPropertiesMissingOnSource = options.copyTargetPropertiesMissingOnSource === undefined ? true : options.copyTargetPropertiesMissingOnSource;
  def.supressEqualProperties = options.supressEqualProperties === undefined ? false : options.supressEqualProperties;
  def.propertyMerge = options.propertyMerge === undefined ? 'merge' : options.propertyMerge;
  def.deepInPrototypes = options.deepInPrototypes === undefined ? false : options.deepInPrototypes;
  def.host = options.host;
  def.customMerge = options.customMerge || [];
  def.customClone = options.customClone || [];
  def.customIsDifferent = options.customIsDifferent || [];
  def.isMergeableObject = options.isMergeableObject === undefined ? isMergeableObject : options.isMergeableObject;
  return def;
};

/** Devuelve la primera función customizada disponible de la lista. */
const getCustomFunction = (functions: any[], ...args: any[]): any => {
  if (!functions || !Array.isArray(functions)) { return; }
  for (const fn of functions) {
    const custom = fn(...args);
    if (typeof custom === 'function') { return custom; }
  }
  return undefined;
};


// ---------------------------------------------------------------------------------------------------
//  isDifferent
// ---------------------------------------------------------------------------------------------------

export type IsDifferentFunctionType = (target: any, source: any, options?: DeepMergeOptions) => boolean;
export type IsDifferentCustomFunctionType = (target: any, source: any, options?: DeepMergeOptions) => IsDifferentFunctionType | undefined;
// export interface IsDifferentCustom { description: string; fn: IsDifferentCustomFunctionType; }

export const isDifferent: IsDifferentFunctionType = (target: any, source: any, options?: DeepMergeOptions): boolean => {
  const kindSource = getKindOfType(source);
  const kindTarget = getKindOfType(target);

  if (kindSource === kindTarget) {
    switch (kindSource) {
      case 'array':
        if (target.length !== source.length) { return true; }
        for (let i = 0; i < target.length; i++) {
          if (isDifferentFn(target[i], source[i], options)) { return true; }
        }
        return false;
      case 'object':
        const targetKeys = getKeys(target);
        const sourceKeys = getKeys(source);
        if (targetKeys.length !== sourceKeys.length) { return true; }
        const isDiff = targetKeys.some(key => {
          if (!propertyIsOnObject(source, key)) { return true; }
          if (isDifferentFn(target[key], source[key], options)) { return true; }
          return false;
        });
        return isDiff;
      case 'special':
        return isSpecialDifferent(target, source);
      default:
        return target !== source;
    }
  } else {
    return true;
  }
};

const isDifferentFn = (target: any, source: any, options: DeepMergeOptions): boolean => {
  // Obtenemos una función personalizada si existe la función.
  const custom: IsDifferentFunctionType = getCustomFunction(options?.customIsDifferent, target, source, options);
  // Si no existe una función personalizada, usamos la función por defecto.
  const fn = custom || isDifferent;
  // Invocamos la función obtenida y devolvemos el resultado.
  return fn(target, source, options);
};

const isSpecialDifferent = (target: any, source: any): boolean => {
  const kindSource = getSpecialKindOfObject(source);
  const kindTarget = getSpecialKindOfObject(target);

  if (kindSource === kindTarget) {
    switch (kindSource) {
      case 'Date': return (target as Date).toString() !== (source as Date).toString();
      case 'RegExp': return (target as RegExp).toString() !== (source as RegExp).toString();
      case 'moment': return !(target as moment.Moment).isSame(source as moment.Moment);
      default:
        // if (isReactElement(value)) { return value; }
        throw new Error(`Unknown kind of special object '${kindSource}'`);
    }
  } else {
    return true;
  }
};


// ---------------------------------------------------------------------------------------------------
//  deepClone
// ---------------------------------------------------------------------------------------------------

export type DeepCloneFunctionType = (value: any, options?: DeepMergeOptions, path?: (string | symbol)[]) => any;
export type DeepCloneCustomFunctionType = (value?: any, options?: DeepMergeOptions, path?: (string | symbol)[]) => DeepCloneFunctionType | undefined;

/** Devuelve una clonación profunda del valor suministrado. */
export const deepClone: DeepCloneFunctionType = (value: any, options?: DeepMergeOptions, path?: (string | symbol)[]): any => {
  // NOTA: Creamos nuevas opciones para asegurar una clonación correcta.
  const cloning: DeepMergeOptions = defaultDeepMergeOptions(options);
  cloning.arrayMerge = 'clone';
  cloning.propertyMerge = 'merge';
  // NOTA: Si es una clonación, target no tendrá nunca propiedades y el destino siempre vendrá vacío.
  cloning.copySourcePropertiesMissingOnTarget = true;
  cloning.arrayCombine = options?.arrayCombine;
  cloning.customMerge = options?.customMerge;
  cloning.customClone = options?.customClone;
  cloning.customIsDifferent = options?.customIsDifferent;
  cloning.isMergeableObject = options?.isMergeableObject || isMergeableObject;
  path = path?.length ? path : [];

  const host = options?.host;

  const kind = getKindOfType(value);
  switch (kind) {
    case 'array': return mergeArray([], value, cloning, path);
    case 'function': return (...args: any[]) => value.apply(host, args);
    case 'object': return mergeObjectFn({}, value, cloning, path);
    case 'primitive': return value === null ? null : value;
    case 'special': return cloneSpecial(value);
    case 'symbol': return value;
    case 'undefined': return undefined;
    default: return value;
  }
};

const cloneSpecial = (value: any): any => {
  const kind = getSpecialKindOfObject(value);
  switch (kind) {
    case 'Date': return new Date((value as Date));
    case 'RegExp': return new RegExp((value as RegExp));
    case 'moment': return moment(value);
    default:
      // if (isReactElement(value)) { return value; }
      throw new Error(`Unknown kind of special object '${kind}'`);
  }
};

const cloneFn = (value: any, options?: DeepMergeOptions, path?: (string | symbol)[]): any => {
  if (!options) { options = defaultDeepMergeOptions(); }
  // Obtenemos una función personalizada si existe la función.
  const custom: DeepCloneFunctionType = getCustomFunction(options?.customClone, value, options, path);
  // Si no existe una función personalizada, usamos la función por defecto.
  const fn = custom || deepClone;
  // Invocamos la función obtenida y devolvemos el resultado.
  return fn(value, options, path);
};


// ---------------------------------------------------------------------------------------------------
//  deepAssign
// ---------------------------------------------------------------------------------------------------

/** Establece el resultado de la mezcla en el propio destino en lugar de crear una instancia aparte como hace por defecto `deepMerge`. */
export const deepAssign: DeepMergeFunctionType = (target: any, source: any, options?: DeepMergeOptions, path?: (string | symbol)[]): any => {
  if (!options) { options = {}; }
  options.mergeInNewInstance = false;
  options.host = target;
  return deepMerge(target, source, options, path);
};


// ---------------------------------------------------------------------------------------------------
//  deepMerge . DeepMergeOptions . defaultDeepMergeOptions
// ---------------------------------------------------------------------------------------------------

export type DeepMergeFunctionType = (target: any, source: any, options?: DeepMergeOptions, path?: (string | symbol)[]) => any;
export type DeepMergeCustomFunctionType = (target?: any, source?: any, options?: DeepMergeOptions, path?: (string | symbol)[]) => DeepMergeFunctionType | undefined;

/** Mezcla los valores de la fuente con los del destino. TODO: Use <T> rather than `any`.
 *
 * ```typescript
 * type DeepMergeFunctionType = (target: any, source: any, options?: DeepMergeOptions, path?: (string | symbol)[]) => any;
 * type DeepMergeCustomFunctionType = (target?: any, source?: any, options?: DeepMergeOptions, path?: (string | symbol)[]) => DeepMergeFunctionType | undefined;
 * ```
 *
 * Ejemplo que evita la sobrescritura del destino en un nivel determinado del objeto evaluado por expresión regular.
 * ```typescript
 * protected customMergeListSettings: DeepMergeCustomFunctionType =
 * (target?: any, source?: any, options?: DeepMergeOptions, path?: (string | symbol)[]): DeepMergeFunctionType | undefined => {
 *   return path.length === 4 && path[0] === 'search' && path[1] === 'values' && path[3] === 'search' ? this.mergeListSettings : undefined;
 * }
 * protected mergeListSettings: DeepMergeFunctionType =
 * (target: any, source: any, options: DeepMergeOptions, path: (string | symbol)[]): any => {
 *   return deepClone(target);
 * }
 * const result = deepMerge(defaults, settings, { customMerge: this.customMergeListSettings });
 * ```
 */
export const deepMerge: DeepMergeFunctionType = (target: any, source: any, options?: DeepMergeOptions, path?: (string | symbol)[]): any => {
  options = defaultDeepMergeOptions(options);
  path = path?.length ? path : [];

  const kindSource = getKindOfType(source);
  const kindTarget = getKindOfType(target);

  const preserve = options.propertyMerge === 'preserve';
  const assign = !options.mergeInNewInstance;

  if (kindSource === kindTarget) {
    switch (kindSource) {
      case 'array':
        if (assign) {
          if (!preserve) { target = mergeArray(target, source, options, path); }
          return target;
        } else {
          return preserve ? cloneFn(target, options, path) : mergeArray(target, source, options, path);
        }
      case 'object':
        if (assign) {
          target = mergeObjectFn(target, source, options, path);
          return target;
        } else {
          return mergeObjectFn(target, source, options, path);
        }
      default:
        return preserve ? (assign ? target : cloneFn(target, options, path)) : cloneFn(source, options, path);
    }
  } else {
    return preserve ? (assign ? target : cloneFn(target, options, path)) : cloneFn(source, options, path);
  }
};

const mergeObjectFn: DeepMergeFunctionType = (target: any, source: any, options?: DeepMergeOptions, path?: (string | symbol)[]): any => {
  if (!options) { options = defaultDeepMergeOptions(); }
  // Obtenemos una función personalizada si existe la función.
  const custom: DeepMergeFunctionType = getCustomFunction(options?.customMerge, target, source, options, path);
  // Si no existe una función personalizada, usamos la función por defecto.
  const fn = custom || mergeObject;
  // Invocamos la función obtenida y devolvemos el resultado.
  return fn(target, source, options, path);
};


// ---------------------------------------------------------------------------------------------------
//  Array merge
// ---------------------------------------------------------------------------------------------------

/**
 * Indica el modo de proceder para mezclar arrays.
 *
 * - **clone**: La fuente (_source_) remplaza completamente los elementos del destino (_target_).
 * - **overwrite**: Se remplazan los elementos del destino (_target_) por los elementos de la misma posición en la fuente (_source_).
 * - **concat**: Los elementos de la fuente (_source_) se añaden a continuación de los elementos del destino (_target_).
 * - **combine**: Los elementos de la fuente (_source_) se combinan con los del destino (_target_) comprobando que no estén repetidos (solo primitivos).
 *
 * Para una resolución personalizada suministrar una función a través de la opción `arrayMerge`.
 */
export type ArrayMergeResolution = 'clone' | 'overwrite' | 'concat' | 'combine';
export type ArrayMergeFunctionType = (target: any[], source: any[], options?: DeepMergeOptions, path?: (string | symbol)[]) => any[];

const mergeArray: ArrayMergeFunctionType = (target: any[], source: any[], options: DeepMergeOptions, path?: (string | symbol)[]): any[] => {
  const assign = !options.mergeInNewInstance;

  target = (target || []).map(value => assign ? value : cloneFn(value, options, path));
  source = (source || []).map(value => cloneFn(value, options, path));

  options = defaultDeepMergeOptions(options);
  path = path?.length ? path : [];

  const destination = assign ? target : [];

  const resolution = options?.arrayMerge || 'combine';
  switch (resolution) {

    case 'clone':
      if (assign) { destination.length = 0; }
      destination.push(...source);
      return destination;

    case 'overwrite':
      for (let i = 0; i < source.length; i++) { destination[i] = source[i]; }
      if (!assign) { for (let i = source.length; i < target.length; i++) { destination[i] = target[i]; } }
      return destination;

    case 'concat':
      if (!assign) { destination.push(...target); }
      destination.push(...source);
      return destination;

    case 'combine':
      const fn = options.arrayCombine || defaultCombineArray;
      return fn(target, source, options, path);
  }
};

export const defaultCombineArray: ArrayMergeFunctionType = (target: any[], source: any[], options: DeepMergeOptions, path?: (string | symbol)[]): any[] => {
  const assign = !options.mergeInNewInstance;

  target = (target || []).map(value => assign ? value : cloneFn(value, options, path));
  source = (source || []).map(value => cloneFn(value, options, path));

  const destination = assign ? target : target.slice();

  for (const value of source) {
    const kind = getKindOfType(value);
    switch (kind) {
      case 'array': case 'object': case 'special':
        if (value.hasOwnProperty('idreg')) {
          const index = destination.findIndex(findRowIndex(value));
          if (index > -1) { destination[index] = deepMerge(destination[index], value, options, path); } else { destination.push(value); }
        } else {
          destination.push(value);
        }
        break;
      case 'primitive':
        if (value === null) {
          destination.push(null);
        } else {
          const found = destination.indexOf(value) > -1;
          if (!found) { destination.push(value); }
        }
        break;
      case 'symbol': case 'function':
        // destination.push(value);
        break;
      case 'undefined':
        // destination.push(undefined);
        break;
    }
  }
  return destination;
};

/**
 * Devuelve el índice de la fila en la colección. Se utiliza como _callback_ para la función `findIndex`.
 *
 * Para poder comparar las filas con `idreg === 'new'` se  espera que éstas tengan una propiedad `idregNew`.
 *
 * ```typescript
 * const index = rows.findIndex(findRowIndex(row));
 * ```
 */
const findRowIndex = (row: any): ((cur: any, index: number, rows: any[]) => boolean) =>
  (cur: any, index: number, rows: any[]): boolean => {
    const idregCur = cur.idreg === 'new' ? (cur.idregNew || cur.idreg) : cur.idreg;
    const idregRow = row.idreg === 'new' ? (row.idregNew || row.idreg) : row.idreg;
    return idregRow === idregCur;
  }
;


// ---------------------------------------------------------------------------------------------------
//  Object merge
// ---------------------------------------------------------------------------------------------------

/**
 * Indica el modo de proceder cuando se quieren mezclar los valores de dos propiedades del mismo tipo.
 *
 * - **merge**: El valor de la fuente (_source_) se combina con el valor del destino (_target_) cuando son del mismo tipo:
 *   los primitivos se remplazan, pero los objetos y arrays se mezclan (_merge_).
 *   Cuando difieren en tipo, se remplazan siempre.
 * - **preserve**: El valor en el destino (_target_) no se alterará de ningún modo.
 * - **supress**: Si existe la propiedad tanto en la fuente (_source_) como en el destino (_target_), se suprimirá del resultado devuelto
 *   independientemente de si sus valores coinciden o no.
 */
export type PropertyMergeResolution = 'merge' | 'preserve' | 'supress';

const mergeObject: DeepMergeFunctionType = (target: any, source: any, options?: DeepMergeOptions, path?: (string | symbol)[]): any => {
  options = defaultDeepMergeOptions(options);

  const targetKeys: (string | symbol)[] = options.isMergeableObject(target) ? getKeys(target) : [];
  const sourceKeys: (string | symbol)[] = getKeys(source);
  const equals: (string | symbol)[] = [];

  if (options.supressEqualProperties) {
    // Recordamos las propiedades comunes cuyos valores también son iguales para suprimirlas más adelante.
    const allKeys: (string | symbol)[] = deepMerge(targetKeys, sourceKeys, { arrayMerge: 'combine' });
    allKeys.forEach(key => { if (!isDifferentFn(target[key], source[key], options)) { equals.push(key); } });
  }

  const assign = !options.mergeInNewInstance;
  const destination = assign ? target : {};

  // Recordamos el host del nivel superior.
  const parent = options.host;
  // Establecemos el host del nivel actual.
  options.host = destination;

  // target -> destination
  if (options.isMergeableObject(target)) {
    targetKeys.forEach(key => {
      const keyPath = path.concat(key);
      const propertyIsOnSource = propertyIsOnObject(source, key);
      const mergeable = options.copyTargetPropertiesMissingOnSource || propertyIsOnSource;
      const supress = options.propertyMerge === 'supress' && propertyIsOnSource || equals.includes(key);
      if (!assign && mergeable && !supress) { destination[key] = cloneFn(target[key], options, keyPath); }
      if (assign && (!mergeable || supress)) { delete destination[key]; }
    });
  }

  // source -> destination
  sourceKeys.forEach(key => {
    const keyPath = path.concat(key);
    const propertyIsOnTarget = propertyIsOnObject(target, key);
    const mergeable = options.copySourcePropertiesMissingOnTarget || propertyIsOnTarget;
    const supress = options.propertyMerge === 'supress' && propertyIsOnTarget || equals.includes(key);
    if (mergeable && !supress) {
      if (propertyIsOnTarget) {
        destination[key] = deepMerge(target[key], source[key], options, keyPath);
      } else {
        destination[key] = cloneFn(source[key], options, keyPath);
      }
    }
  });

  // Restablecemos el host del nivel superior.
  options.host = parent;

  return destination;
};


// ---------------------------------------------------------------------------------------------------
//  propertyIsOnObject . getKeys
// ---------------------------------------------------------------------------------------------------

const propertyIsOnObject = (object: any, property: string | symbol): boolean => {
  if (typeof property === 'string') {
    try { return property in object; } catch (err: any) { return false; }
  } else if (typeof property === 'symbol') {
    try { return !!getEnumerableOwnPropertySymbols(object).find(s => s === property); } catch (err: any) { return false; }
  }
};

const getKeys = (target: any): (string | symbol)[] =>
  (Object.keys(target) as (string | symbol)[]).concat(getEnumerableOwnPropertySymbols(target))
;

const getEnumerableOwnPropertySymbols = (target: any): symbol[] =>
  Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(symbol => target.propertyIsEnumerable(symbol)) : []
;


// ---------------------------------------------------------------------------------------------------
//  isPlainObject
// ---------------------------------------------------------------------------------------------------

/**
 * {@link https://github.com/jonschlinkert/is-plain-object is-plain-object }
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
export const isPlainObject = (o: any): boolean => {

  if (isObject(o) === false) { return false; }

  // If has modified constructor
  const ctor = o.constructor;
  if (ctor === undefined) { return true; }

  // If has modified prototype
  const prot = ctor.prototype;
  if (isObject(prot) === false) { return false; }

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) { return false; }

  // Most likely a plain Object
  return true;
};

const isObject = (o: any): boolean => Object.prototype.toString.call(o) === '[object Object]';


