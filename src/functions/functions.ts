import chalk from 'chalk';
import moment from 'moment';

import { Resource } from '../resource/resource';
import { Terminal } from '../terminal/terminal';


// ---------------------------------------------------------------------------------------------------
//  time
// ---------------------------------------------------------------------------------------------------

export const timestamp = (inp?: moment.MomentInput) => moment(inp).format('YYYY-MM-DD HH:mm:ss.SSS');

export const logTime = (message?: any, ...optionalParams: any[]): void => console.log(`${timestamp()} -> ${message}`, ...optionalParams);


// ---------------------------------------------------------------------------------------------------
//  number
// ---------------------------------------------------------------------------------------------------

export function round(value: number, decimals?: number): number {
  if (decimals === undefined) { decimals = 2; }
  if (+decimals === 0) { return Math.round(value); }

  value = +value;
  const exp = +decimals;

  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) { return NaN; }

  const shift = Math.pow(10, exp);
  return Math.round(value * shift) / shift;
}


// ---------------------------------------------------------------------------------------------------
//  string
// ---------------------------------------------------------------------------------------------------

export function capitalize(text: string): string {
  if (typeof text !== 'string') { return ''; }
  if (text.length < 2) { return text.toUpperCase(); }
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}


// ---------------------------------------------------------------------------------------------------
//  tractament d'errors
// ---------------------------------------------------------------------------------------------------

export interface ErrorObject {
  code?: number;
  message: string,
  data?: any;
};

export const concatError = (error: any, message: string): ErrorObject => {
  const internal = getErrorMessage(error);
  const err = message ? `${message} ${internal}` : internal;
  error = getErrorObject(error);
  error.message = err;
  return error;
};

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') { return error; }
  if (typeof error?.message === 'string') { return error.message; }
  if (typeof error?.error?.message === 'string') { return error.error.message; }
  if (typeof error === 'object') { return JSON.stringify(error); }
  if (typeof error?.toString === 'function') { return error.toString(); }
  return `${error}`;
};

export const getErrorObject = (error: any): ErrorObject => {
  if (typeof error === 'string') { return { message: error }; }
  if (typeof error === 'object') {
    if (typeof error.message !== 'string') { error.message = 'Unknown error.'; }
    return error;
  }
  if (typeof error?.toString === 'function') { return { message: error.toString() }; }
  return { message: 'Unknown error.' };
};



// ---------------------------------------------------------------------------------------------------
//  applyFilterPattern . FilterPatternType
// ---------------------------------------------------------------------------------------------------

export type FilterPatternType = string | RegExp | ((text: string) => boolean) | { test: RegExp | ((text: string) => boolean) };

/**
 * Comprova si el texte compleix el patró de filtre indicat.
 * @returns Retorna `true` quan el texte compleix amb el patró de filtre o si no se n'indica cap.
 * ```typescript
 * type FilterPatternType = string | RegExp | ((text: string) => boolean) | { test: (text: string) => boolean };
 * ```
 */
export function applyFilterPattern(text: string, pattern?: FilterPatternType): boolean {

  if (!pattern || !text) { return true; }

  if (typeof pattern === 'string') {
    const tester = new RegExp(pattern);
    return tester.test(text);

  } else if (pattern instanceof RegExp) {
    const tester: RegExp = pattern;
    return tester.test(text);

  } else if (typeof pattern === 'function') {
    return pattern(text);

  } else if (typeof pattern === 'object') {

    if (pattern.test instanceof RegExp) {
      const tester: RegExp = pattern.test;
      return tester.test(text);

    } else if (typeof pattern.test === 'function') {
      const test: (text: string) => boolean = pattern.test;
      return test(text);
    }
  }
  return true;
}


// ---------------------------------------------------------------------------------------------------
//  package.json
// ---------------------------------------------------------------------------------------------------

export const upgradePatchVersion = (version: string): string => {
  const newVersion: string[] = version.split('.');
  newVersion[2] = `${+newVersion[2] + 1}`;
  return newVersion.join('.');
}

export const upgradeMinorVersion = (version: string): string => {
  const newVersion: string[] = version.split('.');
  newVersion[1] = `${+newVersion[1] + 1}`;
  newVersion[2] = '0';
  return newVersion.join('.');
}

export const upgradeMajorVersion = (version: string): string => {
  const newVersion: string[] = version.split('.');
  newVersion[0] = `${+newVersion[0] + 1}`;
  newVersion[1] = '0';
  newVersion[2] = '0';
  return newVersion.join('.');
}

/** Incrementa la versió de l'arxiu `package.json`.
 *
 * Si no s'estableix l'argument 'level' s'utilitzarà 'patch' com a valor per defecte.
 *
 * {@link https://docs.npmjs.com/about-semantic-versioning [npm]: About semantic versioning}
 * {@link https://semver.org/ Semantic Versioning 2.0.0}
 */
export const incrementPackageVersion = (level?: 'major' | 'minor' | 'patch') => {
  if (level === undefined) { level = 'patch'; }
  const pkg = Resource.open('package.json');
  const version: string[] = pkg.version.split('.');
  switch (level) {
    case 'patch':
      version[2] = `${+version[2] + 1}`;
      break;
    case 'minor':
      version[1] = `${+version[1] + 1}`;
      version[2] = '0';
      break;
    case 'major':
      version[0] = `${+version[0] + 1}`;
      version[1] = '0';
      version[2] = '0';
      break;
  }
  pkg.version = version.join('.');
  Terminal.log('Incremented ' + chalk.bold('package.json') + ' patch version to:', Terminal.green(pkg.version));
  Resource.save('package.json', pkg);
}

export const upgradeDependency = async (packageName: string, type?: '--save-dev' | '--save-prod' | '--save-peer' | '-D') => {
  if (!type) { type = '--save-prod'; }
  if (type === '-D') { type = '--save-dev'; }
  const section = type === '--save-prod' ? 'dependencies' : (type === '--save-peer' ? 'peerDependencies' : 'devDependencies');
  const pkg = Resource.open(`package.json`);
  const oldVersion = pkg[section][packageName];
  Terminal.logInline(`- ${chalk.green(packageName)}: ...`);
  await Terminal.run(`npm i ${packageName} ${type}`);
  const pkg2 = Resource.open(`package.json`);
  const version = pkg2[section][packageName];
  const changed = version !== oldVersion;
  Terminal.log(`+ ${chalk.green(packageName)}: ${changed ? chalk.bold(version) : version}`);
}
