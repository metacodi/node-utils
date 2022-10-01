"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementPackageVersion = exports.upgradeMajorVersion = exports.upgradeMinorVersion = exports.upgradePatchVersion = exports.applyFilterPattern = exports.capitalize = exports.round = exports.logTime = exports.timestamp = void 0;
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
const incrementPackageVersion = () => {
    const pkg = resource_1.Resource.open('package.json');
    const version = pkg.version.split('.');
    version[2] = `${+version[2] + 1}`;
    pkg.version = version.join('.');
    terminal_1.Terminal.log('Incremented ' + chalk_1.default.bold('package.json') + ' patch version to:', terminal_1.Terminal.green(pkg.version));
    resource_1.Resource.save('package.json', pkg);
};
exports.incrementPackageVersion = incrementPackageVersion;
//# sourceMappingURL=functions.js.map