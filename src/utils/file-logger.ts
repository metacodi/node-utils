import * as fs from 'fs';
import moment from 'moment';

import { Terminal } from '../terminal/terminal';
import { Resource } from '../resource/resource';
import { TaskExecutor, TaskExecutorOptions } from './task-executor';


export interface Logger extends TaskExecutor { log(text: string): void }

export type FileStampPeriod = 'annually' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'minutely';

export interface FileLoggerOptions extends TaskExecutorOptions {
  folder?: string;
  basename?: string;
  stamp?: { period?: FileStampPeriod; format?: string };
  extension?: string;
};


// ---------------------------------------------------------------------------------------------------
//  FileLogger
// ---------------------------------------------------------------------------------------------------

export class FileLogger extends TaskExecutor implements Logger {
  constructor(
    public folder: string,
    public options?: FileLoggerOptions,
  ) {
    super({ run: 'sync', add: 'push', consume: 'shift', delay: 0 });

    if (!options) { options = {}; }
    if (options.basename === undefined) { options.basename = ''; }
    if (options.extension === undefined) { options.extension = 'log'; }
    if (options.stamp === undefined) { options.stamp = {}; }
    this.options = options;
  }

  get stamp(): string {
    const { format, period } = this.options?.stamp;
    if (format) {
      const stamp = moment().format(format);
      return stamp;
    } else {
      if (!period) { return ''; }
      const m = moment();
      let stamp = m.format('YYYY');
      if (period === 'annually') { return stamp; }
      stamp += `-${m.format('MM')}`;
      if (period === 'monthly') { return stamp; }
      if (period === 'weekly') {
        stamp += `-w${Math.ceil(+m.format('DD') / 7)}`;
      } else {
        stamp += `-${m.format('DD')}`;
        if (period === 'daily') { return stamp; }
        stamp += ` ${m.format('HH')}h`;
        if (period === 'hourly') { return stamp; }
        stamp += `${m.format('mm')}m`;
      }
      return stamp;
    }
  }

  log(text: string): void {
    // console.log(`doing task ${text}`, moment().format('YYYY-MM-DD H:mm:ss.SSS'));
    super.do(text + '\n');
  }

  protected executeTask(task: string): Promise<void> {
    return new Promise<void>((resolve: any, reject: any) => {
      // console.log(`executing task ${task.trim()}`, moment().format('YYYY-MM-DD H:mm:ss.SSS'));
      const folder = this.folder || '.';
      if (folder !== '.' && !fs.existsSync(folder)) { fs.mkdirSync(folder, { recursive: true }); }
      const { stamp } = this;
      const { basename, extension } = this.options || {};
      const filename = `${basename}${stamp}${extension ? '.' : ''}${extension}`;  
      const url = Resource.normalize(`${folder}/${filename}`);
      // console.log(url);
      Resource.appendFile(url, task);
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

const test = (path: string) => {
  console.log('annually => ', (new FileLogger(path, { stamp: { period: 'annually' }})).stamp);
  console.log('monthly => ', (new FileLogger(path, { stamp: { period: 'monthly' }})).stamp);
  console.log('weekly => ', (new FileLogger(path, { stamp: { period: 'weekly' }})).stamp);
  console.log('daily => ', (new FileLogger(path, { stamp: { period: 'daily' }})).stamp);
  console.log('hourly => ', (new FileLogger(path, { stamp: { period: 'hourly' }})).stamp);
  console.log('minutely => ', (new FileLogger(path, { stamp: { period: 'minutely' }})).stamp);
  console.log('format => ', (new FileLogger(path, { stamp: { format: 'MMM DD YYYY' }})).stamp);
  Terminal.line();
  const exec = new FileLogger('', { stamp: { period: 'minutely' }});
  ['1', '2', '3', '4', '5'].map(task => exec.log(task));
  setTimeout(() => {
    exec.log(`Aquesta tasca s'hauria d'escriure en un altre arxiu`);
  }, 1000 * 62);
};

// test('folder');

