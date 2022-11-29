import * as fs from 'fs';
import moment from 'moment';

import { Terminal } from '../terminal/terminal';
import { Resource } from '../resource/resource';
import { TaskExecutor } from './task-executor';


export interface Logger extends TaskExecutor { log(text: string): void }


// ---------------------------------------------------------------------------------------------------
//  FileLogger
// ---------------------------------------------------------------------------------------------------

export class FileLogger extends TaskExecutor implements Logger {
  constructor(
    public folder: string,
    public logPeriod: 'annually' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'minutely',
    public fileOptions?: { basename?: string; extension?: string }
  ) {
    super({ run: 'sync', add: 'push', consume: 'shift', delay: 0 });

    if (!this.fileOptions) { this.fileOptions = {}; }
    if (this.fileOptions.basename === undefined) { this.fileOptions.basename = ''; }
    if (this.fileOptions.extension === undefined) { this.fileOptions.extension = 'log'; }
  }

  get stamp(): string {
    const m = moment();
    let stamp = m.format('YYYY');
    if (this.logPeriod === 'annually') { return stamp; }
    stamp += `-${m.format('MM')}`;
    if (this.logPeriod === 'monthly') { return stamp; }
    if (this.logPeriod === 'weekly') {
      stamp += `-w${Math.ceil(+m.format('DD') / 7)}`;
    } else {
      stamp += `-${m.format('DD')}`;
      if (this.logPeriod === 'daily') { return stamp; }
      stamp += ` ${m.format('HH')}h`;
      if (this.logPeriod === 'hourly') { return stamp; }
      stamp += `${m.format('mm')}m`;
    }
    return stamp;
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
      const { basename, extension } = this.fileOptions || {};
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
  console.log('annually => ', (new FileLogger(path, 'annually')).stamp);
  console.log('monthly => ', (new FileLogger(path, 'monthly')).stamp);
  console.log('weekly => ', (new FileLogger(path, 'weekly')).stamp);
  console.log('daily => ', (new FileLogger(path, 'daily')).stamp);
  console.log('hourly => ', (new FileLogger(path, 'hourly')).stamp);
  console.log('minutely => ', (new FileLogger(path, 'minutely')).stamp);
  Terminal.line();
  const exec = new FileLogger('', 'minutely');
  ['1', '2', '3', '4', '5'].map(task => exec.log(task));
  setTimeout(() => {
    exec.log(`Aquesta tasca s'hauria d'escriure en un altre arxiu`);
  }, 1000 * 62);
};

// test('folder');

