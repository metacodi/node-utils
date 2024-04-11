"use strict";
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
exports.upgradeDependency = exports.incrementPackageVersion = exports.upgradeMajorVersion = exports.upgradeMinorVersion = exports.upgradePatchVersion = exports.applyFilterPattern = exports.parseError = exports.getErrorObject = exports.getErrorMessage = exports.concatError = exports.toNormalizedPascalCase = exports.toPascalCase = exports.toNormalizedKebabCase = exports.toKebabCase = exports.normalizePhoneNumber = exports.normalizeText = exports.capitalize = exports.round = exports.logTime = exports.timestamp = void 0;
const chalk_1 = __importDefault(require("chalk"));
const moment_1 = __importDefault(require("moment"));
const resource_1 = require("../resource/resource");
const terminal_1 = require("../terminal/terminal");
const timestamp = (inp) => (0, moment_1.default)(inp).format('YYYY-MM-DD HH:mm:ss.SSS');
exports.timestamp = timestamp;
const logTime = (message, ...optionalParams) => console.log(`${(0, exports.timestamp)()} -> ${message}`, ...optionalParams);
exports.logTime = logTime;
function round(value, decimals) {
    if (decimals === undefined) {
        decimals = 2;
    }
    if (+decimals === 0) {
        return Math.round(value);
    }
    value = +value;
    const exp = +decimals;
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
        return NaN;
    }
    const shift = Math.pow(10, exp);
    return Math.round(value * shift) / shift;
}
exports.round = round;
function capitalize(text) {
    if (typeof text !== 'string') {
        return '';
    }
    if (text.length < 2) {
        return text.toUpperCase();
    }
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
exports.capitalize = capitalize;
const normalizeText = (text) => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
exports.normalizeText = normalizeText;
const normalizePhoneNumber = (text) => String(text || '').replace(/\s|-|\.|\(|\)/g, '').replace(/^\+/, '00').replace(/^0034/, '');
exports.normalizePhoneNumber = normalizePhoneNumber;
const toKebabCase = (s) => s ? s.trim().split(/[\s\.\-\_\:]/).map(s => s.replace(/([A-Z])/g, '-$1').toLocaleLowerCase()).join('-').replace(/^-/, '').replace(/--/, '-') : '';
exports.toKebabCase = toKebabCase;
const toNormalizedKebabCase = (text) => (0, exports.toKebabCase)(String(text)).split('-').map(s => (0, exports.normalizeText)(s).replace(/[^\w]/g, '')).join('-');
exports.toNormalizedKebabCase = toNormalizedKebabCase;
const toPascalCase = (s) => s ? `${s.charAt(0).toUpperCase()}${s.slice(1).replace(/[-_ ][A-Za-z]/g, match => match.replace(/[-_ ]/g, '').toUpperCase())}` : '';
exports.toPascalCase = toPascalCase;
const toNormalizedPascalCase = (s) => s ? `${(0, exports.normalizeText)(s).charAt(0).toUpperCase()}${(0, exports.normalizeText)(s).slice(1).replace(/[-_ ][A-Za-z]/g, match => match.replace(/[-_ ]/g, '').toUpperCase())}` : '';
exports.toNormalizedPascalCase = toNormalizedPascalCase;
;
const concatError = (error, message) => {
    const internal = (0, exports.getErrorMessage)(error);
    const err = message ? `${message} ${internal}` : internal;
    error = (0, exports.getErrorObject)(error);
    error.message = err;
    return error;
};
exports.concatError = concatError;
const getErrorMessage = (error) => {
    var _a;
    if (typeof error === 'string') {
        return error;
    }
    if (typeof (error === null || error === void 0 ? void 0 : error.message) === 'string') {
        return error.message;
    }
    if (typeof ((_a = error === null || error === void 0 ? void 0 : error.error) === null || _a === void 0 ? void 0 : _a.message) === 'string') {
        return error.error.message;
    }
    if (typeof error === 'object') {
        return JSON.stringify(error);
    }
    if (typeof (error === null || error === void 0 ? void 0 : error.toString) === 'function') {
        return error.toString();
    }
    return `${error}`;
};
exports.getErrorMessage = getErrorMessage;
const getErrorObject = (error) => {
    if (typeof error === 'string') {
        return { message: error };
    }
    if (typeof error === 'object') {
        if (typeof error.message !== 'string') {
            error.message = 'Unknown error.';
        }
        return error;
    }
    if (typeof (error === null || error === void 0 ? void 0 : error.toString) === 'function') {
        return { message: error.toString() };
    }
    return { message: 'Unknown error.' };
};
exports.getErrorObject = getErrorObject;
const parseError = (error) => {
    if (typeof error === 'string') {
        return error;
    }
    if (typeof error === 'object') {
        if (Array.isArray(error)) {
            return `[${error.map(e => (0, exports.parseError)(e)).join(', ')}]`;
        }
        else {
            const err = [];
            Object.keys(error).map(key => {
                if (typeof error[key] === 'string') {
                    err.push(`"${[key]}":"${error[key]}"`);
                }
                else if (typeof error[key] === 'number') {
                    err.push(`"${[key]}":${error[key]}`);
                }
                else if (key === 'error') {
                    err.push(`"${[key]}":${(0, exports.parseError)(error[key])}`);
                }
                else if (typeof error[key] !== 'function') {
                    try {
                        err.push(`"${[key]}":${JSON.stringify(error[key])}`);
                    }
                    catch (stringifyError) {
                        err.push(`"${[key]}":"Error converting circular structure to JSON."`);
                    }
                }
            });
            if (!Object.keys(error).includes('message') && typeof (error === null || error === void 0 ? void 0 : error.message) === 'string') {
                err.push(`"message":"${error.message}"`);
            }
            return `{${err.join(',')}}`;
        }
    }
    return 'Unknown';
};
exports.parseError = parseError;
function applyFilterPattern(text, pattern) {
    if (!pattern || !text) {
        return true;
    }
    if (typeof pattern === 'string') {
        const tester = new RegExp(pattern);
        return tester.test(text);
    }
    else if (pattern instanceof RegExp) {
        const tester = pattern;
        return tester.test(text);
    }
    else if (typeof pattern === 'function') {
        return pattern(text);
    }
    else if (typeof pattern === 'object') {
        if (pattern.test instanceof RegExp) {
            const tester = pattern.test;
            return tester.test(text);
        }
        else if (typeof pattern.test === 'function') {
            const test = pattern.test;
            return test(text);
        }
    }
    return true;
}
exports.applyFilterPattern = applyFilterPattern;
const upgradePatchVersion = (version) => {
    const newVersion = version.split('.');
    newVersion[2] = `${+newVersion[2] + 1}`;
    return newVersion.join('.');
};
exports.upgradePatchVersion = upgradePatchVersion;
const upgradeMinorVersion = (version) => {
    const newVersion = version.split('.');
    newVersion[1] = `${+newVersion[1] + 1}`;
    newVersion[2] = '0';
    return newVersion.join('.');
};
exports.upgradeMinorVersion = upgradeMinorVersion;
const upgradeMajorVersion = (version) => {
    const newVersion = version.split('.');
    newVersion[0] = `${+newVersion[0] + 1}`;
    newVersion[1] = '0';
    newVersion[2] = '0';
    return newVersion.join('.');
};
exports.upgradeMajorVersion = upgradeMajorVersion;
const incrementPackageVersion = (level) => {
    if (level === undefined) {
        level = 'patch';
    }
    const pkg = resource_1.Resource.open('package.json');
    pkg.version = level === 'patch' ? (0, exports.upgradePatchVersion)(pkg.version) : (level === 'minor' ? (0, exports.upgradeMinorVersion)(pkg.version) : (0, exports.upgradeMajorVersion)(pkg.version));
    resource_1.Resource.save('package.json', pkg);
    terminal_1.Terminal.log(`Incremented ${chalk_1.default.bold('package.json')} ${level} version to:`, terminal_1.Terminal.green(pkg.version));
    return `${pkg.version}`;
};
exports.incrementPackageVersion = incrementPackageVersion;
const upgradeDependency = (packageName, type) => __awaiter(void 0, void 0, void 0, function* () {
    if (!type) {
        type = '--save-prod';
    }
    if (type === '-D') {
        type = '--save-dev';
    }
    const section = type === '--save-prod' ? 'dependencies' : (type === '--save-peer' ? 'peerDependencies' : 'devDependencies');
    const pkg = resource_1.Resource.open(`package.json`);
    const oldVersion = pkg[section][packageName];
    terminal_1.Terminal.logInline(`- ${chalk_1.default.green(packageName)}: ...`);
    yield terminal_1.Terminal.run(`npm i ${packageName} ${type}`);
    const pkg2 = resource_1.Resource.open(`package.json`);
    const version = pkg2[section][packageName];
    const changed = version !== oldVersion;
    terminal_1.Terminal.log(`+ ${chalk_1.default.green(packageName)}: ${changed ? chalk_1.default.bold(version) : version}`);
});
exports.upgradeDependency = upgradeDependency;
//# sourceMappingURL=functions.js.map