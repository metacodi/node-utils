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
    public fileExtension = 'log',
  ) {
    super({ run: 'sync', add: 'push', consume: 'shift', delay: 0 });
  }

  getFileName(): string {
    const m = moment();
    let fileName = m.format('YYYY');
    if (this.logPeriod === 'annually') { return fileName; }
    fileName += `-${m.format('MM')}`;
    if (this.logPeriod === 'monthly') { return fileName; }
    if (this.logPeriod === 'weekly') {
      fileName += `-w${Math.ceil(+m.format('DD') / 7)}`;
    } else {
      fileName += `-${m.format('DD')}`;
      if (this.logPeriod === 'daily') { return fileName; }
      fileName += ` ${m.format('HH')}h`;
      if (this.logPeriod === 'hourly') { return `${fileName}h`; }
      fileName += `${m.format('mm')}m`;
    }
    return fileName;
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
      const url = Resource.normalize(`${folder}/${this.getFileName()}.${this.fileExtension}`);
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
//  npx ts-node logger.ts
// ---------------------------------------------------------------------------------------------------

const test = (path: string) => {
  console.log('annually => ', (new FileLogger(path, 'annually')).getFileName());
  console.log('monthly => ', (new FileLogger(path, 'monthly')).getFileName());
  console.log('weekly => ', (new FileLogger(path, 'weekly')).getFileName());
  console.log('daily => ', (new FileLogger(path, 'daily')).getFileName());
  console.log('hourly => ', (new FileLogger(path, 'hourly')).getFileName());
  console.log('minutely => ', (new FileLogger(path, 'minutely')).getFileName());
  Terminal.line();
  const exec = new FileLogger('', 'minutely');
  ['1', '2', '3', '4', '5'].map(task => exec.log(task));
  setTimeout(() => {
    exec.log(`Aquesta tasca s'hauria d'escriure en un altre arxiu`);
  }, 1000 * 62);
};

// test('folder');

