import * as fs from 'fs';
import moment from 'moment';

import { Terminal } from '../terminal/terminal';
import { Resource } from '../resource/resource';
import { TaskExecutor, TaskExecutorOptions } from './task-executor';


export type FileperiodStamp = 'annually' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'minutely';

export interface Logger extends TaskExecutor { log(text: string): void }

export interface FileLoggerOptions extends TaskExecutorOptions {
  folder?: string;
  basename?: string;
  /** Adds a moment formatted stamp to the file name. */
  formatStamp?: string;
  /** Adds a moment formatted stamp to the file name. */
  periodStamp?: FileperiodStamp;
  /** Indicates the file extension. In order to avoid extension, set value to empty string (''). */
  extension?: string;
};


// ---------------------------------------------------------------------------------------------------
//  FileLogger
// ---------------------------------------------------------------------------------------------------

/**
 * **Usage**
 * ```typescript
 * import { FileLogger } from '@metacodi/node-utils';
 *
 * const logger = new FileLogger({ periodStamp: 'daily' });
 * logger.log('Hello'); // appends content to './2022-11-24.log'
 * ```
 * <br />
 * 
 * **Examples**:
 * ```typescript
 * { folder: 'foo', basename: 'bar' }      // Ex: foo/bar.log
 * { basename: 'bar' }                     // Ex: ./bar.log
 * { basename: 'bar', extension: 'json' }  // Ex: ./bar.json
 * { basename: 'bar', extension: '' }      // Ex: ./bar
 * { formatStamp: 'MMM DD YYYY' }          // Ex: ./Nov 11 2022.log
 * { periodStamp: 'annually' }             // Ex: ./2022.log
 * { periodStamp: 'monthly' }              // Ex: ./2022-11.log
 * { periodStamp: 'daily' }                // Ex: ./2022-11-26.log
 * ```
 * <br />
 * 
 * ```typescript
 * export interface FileLoggerOptions extends TaskExecutorOptions {
 *   folder?: string;
 *   basename?: string;
 *   formatStamp?: string;
 *   periodStamp?: FileperiodStamp;
 *   extension?: string;
 * };
 * ```
 */
export class FileLogger extends TaskExecutor implements Logger {
  constructor(
    public options?: FileLoggerOptions,
  ) {
    super({ run: 'sync', add: 'push', consume: 'shift', delay: 0 });

    if (!options) { options = {}; }
    this.options = options;
  }

  get folder(): string { return this.options?.folder || '.'; }

  get basename(): string { return this.options?.basename || ''; }
  
  get formatStamp(): string { return this.options?.formatStamp || ''; }
  
  get periodStamp(): string { return this.options?.periodStamp || ''; }

  get extension(): string { return this.options?.extension || 'log'; }

  get filename(): string { return `${this.basename}${this.stamp}${this.extension ? '.' : ''}${this.extension}`; }
  
  get fullname(): string { return Resource.normalize(`${this.folder}/${this.filename}`); }

  get stamp(): string {
    const { formatStamp, periodStamp } = this.options || {};
    if (formatStamp) {
      const stamp = moment().format(formatStamp);
      return stamp;
    } else {
      if (!periodStamp) { return ''; }
      const m = moment();
      let stamp = m.format('YYYY');
      if (periodStamp === 'annually') { return stamp; }
      stamp += `-${m.format('MM')}`;
      if (periodStamp === 'monthly') { return stamp; }
      if (periodStamp === 'weekly') {
        stamp += `-w${Math.ceil(+m.format('DD') / 7)}`;
      } else {
        stamp += `-${m.format('DD')}`;
        if (periodStamp === 'daily') { return stamp; }
        stamp += ` ${m.format('HH')}h`;
        if (periodStamp === 'hourly') { return stamp; }
        stamp += `${m.format('mm')}m`;
      }
      return stamp;
    }
  }

  log(text: string): void {
    // console.log(`doing task ${text}`, moment().format('YYYY-MM-DD H:mm:ss.SSS'));
    super.do(text + '\n');
  }

  protected executeTask(content: string): Promise<void> {
    return new Promise<void>((resolve: any, reject: any) => {
      const { folder, fullname } = this;
      // Ens assegurem que existeix la carpeta.
      if (folder !== '.' && !fs.existsSync(folder)) { fs.mkdirSync(folder, { recursive: true }); }
      // Afegim el contingut a l'arxiu. Si l'arxiu no existeix, el crea.
      Resource.appendFile(fullname, content);
      resolve();
    });
  }
}


// // ---------------------------------------------------------------------------------------------------
// //  DatabaseLogger
// // ---------------------------------------------------------------------------------------------------

// export class DatabaseLogger extends TaskExecutor implements Logger {
//   constructor(
//     public credentials: { [key: string]: any },
//   ) {
//     super();
//   }
//   log(text: string): void {
//     console.log(`doing task ${text}`, moment().format('YYYY-MM-DD H:mm:ss.SSS'));
//     super.do(text + '\n');
//   }
//   protected executeTask(task: any): Promise<any> {
//     return new Promise<any>((resolve: any, reject: any) => {
//       console.log(`executing task ${task.trim()}`, moment().format('YYYY-MM-DD H:mm:ss.SSS'));

//       // TODO: enviar el log a la base de dades.

//       resolve();
//     });
//   }
// }


// ---------------------------------------------------------------------------------------------------
//  test
// ---------------------------------------------------------------------------------------------------
//  npx ts-node src/utils/file-logger.ts
// ---------------------------------------------------------------------------------------------------

const test = (folder: string) => {
  console.log('annually => ', (new FileLogger({ folder, periodStamp: 'annually' })).fullname);
  console.log('monthly => ', (new FileLogger({ folder, periodStamp: 'monthly' })).fullname);
  console.log('weekly => ', (new FileLogger({ folder, periodStamp: 'weekly' })).fullname);
  console.log('daily => ', (new FileLogger({ folder, periodStamp: 'daily' })).fullname);
  console.log('hourly => ', (new FileLogger({ folder, periodStamp: 'hourly' })).fullname);
  console.log('minutely => ', (new FileLogger({ folder, periodStamp: 'minutely' })).fullname);
  console.log('format => ', (new FileLogger({ folder, formatStamp: 'MMM DD YYYY' })).fullname);
  console.log('basename => ', (new FileLogger({ folder, basename: 'base_name' })).fullname);
  console.log('base + stamp => ', (new FileLogger({ folder, basename: 'base_name-', periodStamp: 'daily' })).fullname);
  console.log('without folder => ', (new FileLogger({ basename: 'base_name' })).fullname);
  Terminal.line();
  // const exec = new FileLogger({ periodStamp: 'minutely' }});
  // ['1', '2', '3', '4', '5'].map(task => exec.log(task));
  // setTimeout(() => {
  //   exec.log(`Aquesta tasca s'hauria d'escriure en un altre arxiu`);
  // }, 1000 * 62);
};

// test('test-folder');

