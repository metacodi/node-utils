"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlainObject = exports.defaultCombineArray = exports.deepMerge = exports.deepAssign = exports.deepClone = exports.isDifferent = exports.defaultDeepMergeOptions = exports.getKindOfType = exports.getSpecialKindOfObject = exports.isMergeableObject = void 0;
const moment_1 = __importDefault(require("moment"));
const isMergeableObject = (value) => isNonNullObject(value) && !isSpecialObject(value);
exports.isMergeableObject = isMergeableObject;
const isNonNullObject = (value) => !!value && typeof value === 'object';
const canUseSymbol = typeof Symbol === 'function' && Symbol.for;
const REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;
const isReactElement = (value) => value.$$typeof === REACT_ELEMENT_TYPE;
const isSpecialObject = (value) => {
    try {
        const kind = (0, exports.getSpecialKindOfObject)(value);
        return true;
    }
    catch (err) {
        return false;
    }
};
const getSpecialKindOfObject = (value) => {
    if (moment_1.default.isMoment(value)) {
        return 'moment';
    }
    const objKind = Object.prototype.toString.call(value);
    switch (objKind) {
        case '[object Date]': return 'Date';
        case '[object RegExp]': return 'RegExp';
        default:
            throw new Error(`Unknown special kind of object '${objKind}'.`);
    }
};
exports.getSpecialKindOfObject = getSpecialKindOfObject;
const getKindOfType = (value) => {
    switch (typeof value) {
        case 'bigint': return 'primitive';
        case 'boolean': return 'primitive';
        case 'function': return 'function';
        case 'number': return 'primitive';
        case 'object':
            if (isSpecialObject(value)) {
                return 'special';
            }
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
exports.getKindOfType = getKindOfType;
const defaultDeepMergeOptions = (options) => {
    if (!options) {
        options = {};
    }
    const def = {};
    def.mergeInNewInstance = options.mergeInNewInstance === undefined ? true : options.mergeInNewInstance;
    def.arrayMerge = options.arrayMerge === undefined ? 'combine' : options.arrayMerge;
    def.arrayCombine = options.arrayCombine === undefined ? exports.defaultCombineArray : options.arrayCombine;
    def.copySourcePropertiesMissingOnTarget = options.copySourcePropertiesMissingOnTarget === undefined ? true : options.copySourcePropertiesMissingOnTarget;
    def.copyTargetPropertiesMissingOnSource = options.copyTargetPropertiesMissingOnSource === undefined ? true : options.copyTargetPropertiesMissingOnSource;
    def.supressEqualProperties = options.supressEqualProperties === undefined ? false : options.supressEqualProperties;
    def.propertyMerge = options.propertyMerge === undefined ? 'merge' : options.propertyMerge;
    def.deepInPrototypes = options.deepInPrototypes === undefined ? false : options.deepInPrototypes;
    def.host = options.host;
    def.customMerge = options.customMerge || [];
    def.customClone = options.customClone || [];
    def.customIsDifferent = options.customIsDifferent || [];
    def.isMergeableObject = options.isMergeableObject === undefined ? exports.isMergeableObject : options.isMergeableObject;
    return def;
};
exports.defaultDeepMergeOptions = defaultDeepMergeOptions;
const getCustomFunction = (functions, ...args) => {
    if (!functions || !Array.isArray(functions)) {
        return;
    }
    for (const fn of functions) {
        const custom = fn(...args);
        if (typeof custom === 'function') {
            return custom;
        }
    }
    return undefined;
};
const isDifferent = (target, source, options) => {
    const kindSource = (0, exports.getKindOfType)(source);
    const kindTarget = (0, exports.getKindOfType)(target);
    if (kindSource === kindTarget) {
        switch (kindSource) {
            case 'array':
                if (target.length !== source.length) {
                    return true;
                }
                for (let i = 0; i < target.length; i++) {
                    if (isDifferentFn(target[i], source[i], options)) {
                        return true;
                    }
                }
                return false;
            case 'object':
                const targetKeys = getKeys(target);
                const sourceKeys = getKeys(source);
                if (targetKeys.length !== sourceKeys.length) {
                    return true;
                }
                const isDiff = targetKeys.some(key => {
                    if (!propertyIsOnObject(source, key)) {
                        return true;
                    }
                    if (isDifferentFn(target[key], source[key], options)) {
                        return true;
                    }
                    return false;
                });
                return isDiff;
            case 'special':
                return isSpecialDifferent(target, source);
            default:
                return target !== source;
        }
    }
    else {
        return true;
    }
};
exports.isDifferent = isDifferent;
const isDifferentFn = (target, source, options) => {
    const custom = getCustomFunction(options === null || options === void 0 ? void 0 : options.customIsDifferent, target, source, options);
    const fn = custom || exports.isDifferent;
    return fn(target, source, options);
};
const isSpecialDifferent = (target, source) => {
    const kindSource = (0, exports.getSpecialKindOfObject)(source);
    const kindTarget = (0, exports.getSpecialKindOfObject)(target);
    if (kindSource === kindTarget) {
        switch (kindSource) {
            case 'Date': return target.toString() !== source.toString();
            case 'RegExp': return target.toString() !== source.toString();
            case 'moment': return !target.isSame(source);
            default:
                throw new Error(`Unknown kind of special object '${kindSource}'`);
        }
    }
    else {
        return true;
    }
};
const deepClone = (value, options, path) => {
    const cloning = (0, exports.defaultDeepMergeOptions)(options);
    cloning.arrayMerge = 'clone';
    cloning.propertyMerge = 'merge';
    cloning.copySourcePropertiesMissingOnTarget = true;
    cloning.arrayCombine = options === null || options === void 0 ? void 0 : options.arrayCombine;
    cloning.customMerge = options === null || options === void 0 ? void 0 : options.customMerge;
    cloning.customClone = options === null || options === void 0 ? void 0 : options.customClone;
    cloning.customIsDifferent = options === null || options === void 0 ? void 0 : options.customIsDifferent;
    cloning.isMergeableObject = (options === null || options === void 0 ? void 0 : options.isMergeableObject) || exports.isMergeableObject;
    path = (path === null || path === void 0 ? void 0 : path.length) ? path : [];
    const host = options === null || options === void 0 ? void 0 : options.host;
    const kind = (0, exports.getKindOfType)(value);
    switch (kind) {
        case 'array': return mergeArray([], value, cloning, path);
        case 'function': return (...args) => value.apply(host, args);
        case 'object': return mergeObjectFn({}, value, cloning, path);
        case 'primitive': return value === null ? null : value;
        case 'special': return cloneSpecial(value);
        case 'symbol': return value;
        case 'undefined': return undefined;
        default: return value;
    }
};
exports.deepClone = deepClone;
const cloneSpecial = (value) => {
    const kind = (0, exports.getSpecialKindOfObject)(value);
    switch (kind) {
        case 'Date': return new Date(value);
        case 'RegExp': return new RegExp(value);
        case 'moment': return (0, moment_1.default)(value);
        default:
            throw new Error(`Unknown kind of special object '${kind}'`);
    }
};
const cloneFn = (value, options, path) => {
    if (!options) {
        options = (0, exports.defaultDeepMergeOptions)();
    }
    const custom = getCustomFunction(options === null || options === void 0 ? void 0 : options.customClone, value, options, path);
    const fn = custom || exports.deepClone;
    return fn(value, options, path);
};
const deepAssign = (target, source, options, path) => {
    if (!options) {
        options = {};
    }
    options.mergeInNewInstance = false;
    options.host = target;
    return (0, exports.deepMerge)(target, source, options, path);
};
exports.deepAssign = deepAssign;
const deepMerge = (target, source, options, path) => {
    options = (0, exports.defaultDeepMergeOptions)(options);
    path = (path === null || path === void 0 ? void 0 : path.length) ? path : [];
    const kindSource = (0, exports.getKindOfType)(source);
    const kindTarget = (0, exports.getKindOfType)(target);
    const preserve = options.propertyMerge === 'preserve';
    const assign = !options.mergeInNewInstance;
    if (kindSource === kindTarget) {
        switch (kindSource) {
            case 'array':
                if (assign) {
                    if (!preserve) {
                        target = mergeArray(target, source, options, path);
                    }
                    return target;
                }
                else {
                    return preserve ? cloneFn(target, options, path) : mergeArray(target, source, options, path);
                }
            case 'object':
                if (assign) {
                    target = mergeObjectFn(target, source, options, path);
                    return target;
                }
                else {
                    return mergeObjectFn(target, source, options, path);
                }
            default:
                return preserve ? (assign ? target : cloneFn(target, options, path)) : cloneFn(source, options, path);
        }
    }
    else {
        return preserve ? (assign ? target : cloneFn(target, options, path)) : cloneFn(source, options, path);
    }
};
exports.deepMerge = deepMerge;
const mergeObjectFn = (target, source, options, path) => {
    if (!options) {
        options = (0, exports.defaultDeepMergeOptions)();
    }
    const custom = getCustomFunction(options === null || options === void 0 ? void 0 : options.customMerge, target, source, options, path);
    const fn = custom || mergeObject;
    return fn(target, source, options, path);
};
const mergeArray = (target, source, options, path) => {
    const assign = !options.mergeInNewInstance;
    target = (target || []).map(value => assign ? value : cloneFn(value, options, path));
    source = (source || []).map(value => cloneFn(value, options, path));
    options = (0, exports.defaultDeepMergeOptions)(options);
    path = (path === null || path === void 0 ? void 0 : path.length) ? path : [];
    const destination = assign ? target : [];
    const resolution = (options === null || options === void 0 ? void 0 : options.arrayMerge) || 'combine';
    switch (resolution) {
        case 'clone':
            if (assign) {
                destination.length = 0;
            }
            destination.push(...source);
            return destination;
        case 'overwrite':
            for (let i = 0; i < source.length; i++) {
                destination[i] = source[i];
            }
            if (!assign) {
                for (let i = source.length; i < target.length; i++) {
                    destination[i] = target[i];
                }
            }
            return destination;
        case 'concat':
            if (!assign) {
                destination.push(...target);
            }
            destination.push(...source);
            return destination;
        case 'combine':
            const fn = options.arrayCombine || exports.defaultCombineArray;
            return fn(target, source, options, path);
    }
};
const defaultCombineArray = (target, source, options, path) => {
    const assign = !options.mergeInNewInstance;
    target = (target || []).map(value => assign ? value : cloneFn(value, options, path));
    source = (source || []).map(value => cloneFn(value, options, path));
    const destination = assign ? target : target.slice();
    for (const value of source) {
        const kind = (0, exports.getKindOfType)(value);
        switch (kind) {
            case 'array':
            case 'object':
            case 'special':
                if (value.hasOwnProperty('idreg')) {
                    const index = destination.findIndex(findRowIndex(value));
                    if (index > -1) {
                        destination[index] = (0, exports.deepMerge)(destination[index], value, options, path);
                    }
                    else {
                        destination.push(value);
                    }
                }
                else {
                    destination.push(value);
                }
                break;
            case 'primitive':
                if (value === null) {
                    destination.push(null);
                }
                else {
                    const found = destination.indexOf(value) > -1;
                    if (!found) {
                        destination.push(value);
                    }
                }
                break;
            case 'symbol':
            case 'function':
                break;
            case 'undefined':
                break;
        }
    }
    return destination;
};
exports.defaultCombineArray = defaultCombineArray;
const findRowIndex = (row) => (cur, index, rows) => {
    const idregCur = cur.idreg === 'new' ? (cur.idregNew || cur.idreg) : cur.idreg;
    const idregRow = row.idreg === 'new' ? (row.idregNew || row.idreg) : row.idreg;
    return idregRow === idregCur;
};
const mergeObject = (target, source, options, path) => {
    options = (0, exports.defaultDeepMergeOptions)(options);
    const targetKeys = options.isMergeableObject(target) ? getKeys(target) : [];
    const sourceKeys = getKeys(source);
    const equals = [];
    if (options.supressEqualProperties) {
        const allKeys = (0, exports.deepMerge)(targetKeys, sourceKeys, { arrayMerge: 'combine' });
        allKeys.forEach(key => { if (!isDifferentFn(target[key], source[key], options)) {
            equals.push(key);
        } });
    }
    const assign = !options.mergeInNewInstance;
    const destination = assign ? target : {};
    const parent = options.host;
    options.host = destination;
    if (options.isMergeableObject(target)) {
        targetKeys.forEach(key => {
            const keyPath = path.concat(key);
            const propertyIsOnSource = propertyIsOnObject(source, key);
            const mergeable = options.copyTargetPropertiesMissingOnSource || propertyIsOnSource;
            const supress = options.propertyMerge === 'supress' && propertyIsOnSource || equals.includes(key);
            if (!assign && mergeable && !supress) {
                destination[key] = cloneFn(target[key], options, keyPath);
            }
            if (assign && (!mergeable || supress)) {
                delete destination[key];
            }
        });
    }
    sourceKeys.forEach(key => {
        const keyPath = path.concat(key);
        const propertyIsOnTarget = propertyIsOnObject(target, key);
        const mergeable = options.copySourcePropertiesMissingOnTarget || propertyIsOnTarget;
        const supress = options.propertyMerge === 'supress' && propertyIsOnTarget || equals.includes(key);
        if (mergeable && !supress) {
            if (propertyIsOnTarget) {
                destination[key] = (0, exports.deepMerge)(target[key], source[key], options, keyPath);
            }
            else {
                destination[key] = cloneFn(source[key], options, keyPath);
            }
        }
    });
    options.host = parent;
    return destination;
};
const propertyIsOnObject = (object, property) => {
    if (typeof property === 'string') {
        try {
            return property in object;
        }
        catch (err) {
            return false;
        }
    }
    else if (typeof property === 'symbol') {
        try {
            return !!getEnumerableOwnPropertySymbols(object).find(s => s === property);
        }
        catch (err) {
            return false;
        }
    }
};
const getKeys = (target) => Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
const getEnumerableOwnPropertySymbols = (target) => Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(symbol => target.propertyIsEnumerable(symbol)) : [];
const isPlainObject = (o) => {
    if (isObject(o) === false) {
        return false;
    }
    const ctor = o.constructor;
    if (ctor === undefined) {
        return true;
    }
    const prot = ctor.prototype;
    if (isObject(prot) === false) {
        return false;
    }
    if (prot.hasOwnProperty('isPrototypeOf') === false) {
        return false;
    }
    return true;
};
exports.isPlainObject = isPlainObject;
const isObject = (o) => Object.prototype.toString.call(o) === '[object Object]';
//# sourceMappingURL=deep-merge.js.map