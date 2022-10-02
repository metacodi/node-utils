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

export const incrementPackageVersion = () => {
  const pkg = Resource.open('package.json');
  const version: string[] = pkg.version.split('.');
  version[2] = `${+version[2] + 1}`;
  pkg.version = version.join('.');
  Terminal.log('Incremented ' + chalk.bold('package.json') + ' patch version to:', Terminal.green(pkg.version));
  Resource.save('package.json', pkg);
}