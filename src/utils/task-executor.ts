import EventEmitter from 'events';
import moment from 'moment';

import { deepClone } from './deep-merge';
import { logTime, timestamp } from '../functions/functions';
import { Terminal } from '../terminal/terminal';



export interface Interval {
  period: number;
  unitOfTime?: moment.unitOfTime.DurationAs;
}

/**
 * ```typescript
 * export interface TaskExecutorOptions {
 *   add?: 'unshift' | 'push';
 *   consume?: 'shift' | 'pop';
 *   run?: 'sync' | 'async';
 *   // Quan `run === 'sync'`, indica el nombre de milisegons que es deixaran passar entre l'execució d'una tasca i la següent tasca.
 *   delay?: number;
 *   // Limita el nombre de tasques que es podran executar durant el periode actual.
 *   maxTasksInPeriod?: number;
 *   maxTasksCheckingPeriod?: number;
 * };
 * ```
 */
export interface TaskExecutorOptions {
  add?: 'unshift' | 'push';
  consume?: 'shift' | 'pop';
  run?: 'sync' | 'async';
  /** Quan `run === 'sync'`, indica el nombre de milisegons que es deixaran passar entre l'execució d'una tasca i la següent tasca. */
  delay?: number;
  /** Quan `run === 'sync'`, indica el nombre de milisegons que es deixaran passar abans de donar per perduda l'execució de la tasca actual. */
  timeoutTaskPeriod?: number;
  /** Limita el nombre de tasques que es podran executar durant el periode actual. */
  maxTasksInPeriod?: number;
  maxTasksCheckingPeriod?: number;
};

/**
 * ```typescript
 * export interface TaskType {
 *   // Permet que l'executor pugui ordenar les tasques.
 *   priority?: number;
 *   // Temps en milisegons abans de donar la tasca per perduda.
 *   timeout?: number;
 * }
 * ```
 */
export interface TaskType {
  /** Permet que l'executor pugui ordenar les tasques. */
  priority?: number;
  /** Temps en milisegons abans de donar la tasca per perduda. */
  timeout?: number;
}

/**
 * ```typescript
 * export interface TaskResult<T extends TaskType | string> {
 *   task: T;
 *   started?: string;
 *   ended?: string;
 *   error?: any;
 * };
 * ```
 */
export interface TaskResult<T extends TaskType | string> {
  task: T;
  started?: string;
  ended?: string;
  error?: any;
};

export abstract class TaskExecutor<T extends TaskType | string> extends EventEmitter {
  /** Cua de tasques.
   *
   * ISSUE: Aquesta propietat és `private` per solucionar un problema ocasionat durant el consum de tasques
   * que acabava generant duplicitat de tasques a la cua quan s'establia una referència externa a l'array.
   *
   * Per accedir a les tasques de la cua es pot utilitzar la funció `getTasks()`.
   */
  private queue: T[] = [];
  /** Indica quan hi ha una tasca en execució. */
  isExecutingTask = false;
  /** Referència a la tasca actualment en execució. */
  currentTask: T = undefined;
  /** Taasques executades. */
  history: TaskResult<T>[] = [];
  /** Indica si l'execució asíncrona de la cua està suspesa per un període determinat. */
  isSleeping = false;
  /** Indica quan l'execució de la cua està en pausa per una crida a `pauseQueue()`. */
  isExecutionPaused = false;
  /** Indica quan hi ha una operació d'actualització de límits a l'espera. */
  changeLimitsPending = false;
  /** Quantitat de consultes realitzades durant el periode actual. */
  executedTasksInPeriod = 0;

  constructor(
    public options?: TaskExecutorOptions,
  ) {
    super({ captureRejections: false });
    if (!options) { options = {}; }
    if (options.run === undefined) { options.run = 'sync'; }
    if (options.add === undefined) { options.add = 'push'; }
    if (options.consume === undefined) { options.consume = 'shift'; }
    if (options.delay === undefined) { options.delay = 0; }
    if (options.maxTasksInPeriod === undefined) { options.maxTasksInPeriod = 0; }
    if (options.maxTasksCheckingPeriod === undefined) { options.maxTasksCheckingPeriod = 0; }
    // console.log(JSON.stringify(options) + '\n');
    this.options = options;
  }

  /** @deprecated Utilitzar `doTask()` com a alternativa. */
  do(task: T) {
    // Afegim la tasca a la cua.
    this.addTask(task);
    // Endrecem les tasques per prioritat.
    if (this.hasPriority) { this.sortTasksByPriority(); }
    // Provem d'executar la tasca.
    this.executeQueue();
  }

  doTask(task: T) {
    // Afegim la tasca a la cua.
    this.addTask(task);
    // Endrecem les tasques per prioritat.
    if (this.hasPriority) { this.sortTasksByPriority(); }
    // Provem d'executar la tasca.
    this.executeQueue();
  }

  doTasks(tasks: T[]) {
    if (!Array.isArray(tasks)) { tasks = !tasks ? [] : [tasks]; }
    // Afegim les tasques a la cua.
    ((tasks || []) as T[]).forEach(task => this.addTask(task));
    // Endrecem les tasques per prioritat.
    if (this.hasPriority) { this.sortTasksByPriority(); }
    // Provem d'executar la tasca.
    this.executeQueue();
  }

  protected executeQueue() {
    // Comprovem que no estigui en pausa.
    if (this.isExecutionPaused) { return; }
    // Evitem els solapaments mentre s'executa una altra tasca.
    if (this.isExecutingTask) { return; }
    // Mentre existeixin tasques pendents i no haguem superat el màxim limitat.
    if (this.hasTasksToConsume) {
      // Si l'interval s'havia aturat pq la cua estava buida de tasques, ara l'iniciem de nou.
      if (this.maxTasksInPeriod > 0 && !this.isMaxTaskCheckingStarted) { this.startMaxTasksCheckingInterval(); }
      // Establim l'indicador d'estat per blocar l'accés a la cua.
      this.isExecutingTask = true;

      if (this.run === 'sync') {
        // sync: seqüencial
        if (this.delay) { setTimeout(() => this.nextTask(), this.delay); } else { this.nextTask(); }

      } else {
        // async: paral·lel
        while (this.hasTasksToConsume && !this.isSleeping && !this.isExecutionPaused) {
          // Executem la següent tasca de la cua.
          const task = this.consumeTask();
          const result: TaskResult<T> = { task, started: timestamp() };
          // Si s'ha establert un màxim, incrementem el comptador.
          if (this.maxTasksInPeriod > 0) { this.executedTasksInPeriod += 1; }

          let timeout: NodeJS.Timeout;
          let isTimeoutDone = false;
          // Si la tasca ve informada amb un periode d'execució el prioritzem per damunt de les opcions de configuració.
          const period = (typeof task !== 'string' ? task.timeout : 0) || this.timeoutTaskPeriod || 0;
          if (period > 0) {
            timeout = setTimeout(() => {
              // Evitem que s'executi la cua quan la tasca ja s'havia donat per perduda.
              isTimeoutDone = true;
              // result.error = { message: `Timeout error: ${moment.utc(moment.duration(period, 'milliseconds').asMilliseconds()).format('HH:mm:ss.sss')}` };
              const d = moment.duration(period, 'milliseconds');
              const t = moment().hours(d.hours()).minutes(d.minutes()).seconds(d.seconds()).milliseconds(d.milliseconds());
              result.error = { message: `Timeout error (duration: ${t.format('HH:mm:ss.SSS')})` };
              // Processem el resultat.
              result.ended = timestamp();
              this.history.unshift(result);
              // Aturem el timeout.
              if (timeout) { clearTimeout(timeout); }
              // Notifiquem el timeout de l'execució de la tasca.
              this.emit('taskTimeout', result);
            }, period);
          }
          this.emit('executingTask', result);
          this.executeTask(task).catch(error => {
            // Reportem l'error.
            result.error = error;

          }).finally(() => {
            // Evitem que s'executi la cua quan la tasca ja s'havia donat per perduda.
            if (period === 0 || !isTimeoutDone) {
              // Processem el resultat.
              result.ended = timestamp();
              this.history.unshift(result);
              // Aturem el timeout.
              if (timeout) { clearTimeout(timeout); }
              // Notifiquem la tasca executada.
              this.emit('taskExecuted', result);

            } else {
              // Notifiquem la tasca executada encara que l'haguem donada per timeout.
              result.ended = timestamp();
              this.emit('taskExecuted', result);
            }
          });
        }
        // Restablim l'indicador d'estat per desblocar la cua.
        this.isExecutingTask = false;
        this.currentTask = undefined;
      }
    }
  }

  /** Procediment que s'ha d'implementar a la classe heredada. */
  protected abstract executeTask(task: T): Promise<T>;


  //  pause . resume
  // ---------------------------------------------------------------------------------------------------

  pauseQueue() {
    // Establim l'indicador d'estat.
    this.isExecutionPaused = true;
    // Aturem l'interval.
    this.stopMaxTasksCheckingInterval();
  }

  resumeQueue() {
    // Establim l'indicador d'estat.
    this.isExecutionPaused = false;
    // Reprenem l'execució.
    this.executeQueue();
  }


  //  sync: execució seqüencial
  // ---------------------------------------------------------------------------------------------------

  protected nextTask(): void {
    // Comprovem que no estigui en pausa.
    if (this.isExecutionPaused) { return; }

    // Executem la següent tasca de la cua pel principi o pel final.
    const task = this.consumeTask();
    const result: TaskResult<T> = { task, started: timestamp() };
    this.currentTask = task;
    // Si s'ha establert un màxim, incrementem el comptador.
    if (this.maxTasksInPeriod > 0) { this.executedTasksInPeriod += 1; }
    // NOTA: Per evitar que s'aturi la seqüència, iniciem un periode de timeout per forçar l'execució de la següent tasca.
    let timeout: NodeJS.Timeout;
    let isTimeoutDone = false;
    // Si la tasca ve informada amb un periode d'execució el prioritzem per damunt de les opcions de configuració.
    const period = (typeof task !== 'string' ? task.timeout : 0) || this.timeoutTaskPeriod || 0;
    if (period > 0) {
      timeout = setTimeout(() => {
        // Evitem que s'executi la cua quan la tasca ja s'havia donat per perduda.
        isTimeoutDone = true;
        // result.error = { message: `Timeout error: ${moment.utc(moment.duration(period, 'milliseconds').asMilliseconds()).format('HH:mm:ss.sss')}` };
        const d = moment.duration(period, 'milliseconds');
        const t = moment().hours(d.hours()).minutes(d.minutes()).seconds(d.seconds()).milliseconds(d.milliseconds());
        result.error = { message: `Timeout error (duration: ${t.format('HH:mm:ss.SSS')})` };
        // Processem el resultat.
        result.ended = timestamp();
        this.history.unshift(result);
        // Aturem el timeout.
        if (timeout) { clearTimeout(timeout); }
        // Notifiquem el timeout de l'execució de la tasca.
        this.emit('taskTimeout', result);
        // Restablim l'indicador d'estat per desblocar la cua.
        this.isExecutingTask = false;
        this.currentTask = undefined;
        // Mentre quedin tasques s'aniran consumint de la cua.
        this.executeQueue();
      }, period);
    }
    this.emit('executingTask', result);
    // Esperem el callback per garantir un procés seqüencial.
    this.executeTask(task).catch(error => {
      // Reportem l'error.
      result.error = error;

    }).finally(() => {
      // Evitem que s'executi la cua quan la tasca ja s'havia donat per perduda.
      if (period === 0 || !isTimeoutDone) {
        // Processem el resultat.
        result.ended = timestamp();
        this.history.unshift(result);
        // Aturem el timeout.
        if (timeout) { clearTimeout(timeout); }
        // Notifiquem la tasca executada.
        this.emit('taskExecuted', result);
        // Restablim l'indicador d'estat per desblocar la cua.
        this.isExecutingTask = false;
        this.currentTask = undefined;
        // Mentre quedin tasques s'aniran consumint de la cua.
        this.executeQueue();

      } else {
        // Notifiquem la tasca executada encara que l'haguem donada per timeout.
        result.ended = timestamp();
        this.emit('taskExecuted', result);
      }
    });
  }


  //  async: execució en paral·lel amb control de max tasques per periode
  // ---------------------------------------------------------------------------------------------------
  //  NOTA: L'interval s'activa quan s'estableix l'opció `maxTasksInPeriod > 0`.

  /** @hidden */
  private maxTasksCheckingSubscription: NodeJS.Timeout = undefined;

  protected startMaxTasksCheckingInterval() {
    const { maxTasksCheckingPeriod } = this; // [s]
    if (this.maxTasksInPeriod > 0) {
      // logTime('----------- START interval', maxTasksCheckingPeriod);
      // if (this.maxTasksCheckingSubscription !== undefined) { this.maxTasksCheckingSubscription.unsubscribe(); }
      if (this.maxTasksCheckingSubscription !== undefined) { clearInterval(this.maxTasksCheckingSubscription); }
      this.executedTasksInPeriod = 0;
      // this.maxTasksCheckingSubscription = interval(maxTasksCheckingPeriod * 1000).subscribe(() => this.processMaxTasksCheckingInterval());
      this.maxTasksCheckingSubscription = setInterval(() => this.processMaxTasksCheckingInterval(), maxTasksCheckingPeriod * 1000);
    }
  }

  protected stopMaxTasksCheckingInterval() {
    // logTime('STOP interval\n');
    if (this.maxTasksCheckingSubscription !== undefined) { clearInterval(this.maxTasksCheckingSubscription); }
    this.maxTasksCheckingSubscription = undefined;
  }

  protected sleepMaxTasksCheckingInterval(period?: number) {
    if (!period) { period = 10; }
    this.isSleeping = true;
    // Aturem l'interval.
    this.stopMaxTasksCheckingInterval();
    // Restablim el comptador de tasques de l'interval.
    this.executedTasksInPeriod = 0;
    // Restablim l'indicador d'estat per desblocar la cua.
    this.isExecutingTask = false;
    this.currentTask = undefined;
    // Esperem un temps prudencial abans de tornar a executar la cua.
    setTimeout(() => {
      this.isSleeping = false;
      this.executeQueue();
    }, period * 1000);
  }

  protected processMaxTasksCheckingInterval() {
    // logTime('----------- interval');
    // Si hi ha una operació de canvi de límits pendent, ara és l'hora de fer el canvi.
    if (this.changeLimitsPending) { this.changeLimitsPending = false; this.stopMaxTasksCheckingInterval(); return this.executeQueue(); }
    // Comprovem que s'hagi executat almenys una tasca durant l'interval.
    if (this.executedTasksInPeriod === 0) { return this.stopMaxTasksCheckingInterval(); }
    // Reiniciem el comptador.
    this.executedTasksInPeriod = 0;
    // S'ha esgotat el periode, tornem a llançar la cua.
    this.executeQueue();
  }

  protected get isMaxTaskCheckingStarted(): boolean { return this.maxTasksCheckingSubscription !== undefined; }


  //  queue
  // ---------------------------------------------------------------------------------------------------

  /** Retorna una còpia de les tasques de la cua. */
  getTasks(options?: { includeCurrentTask?: boolean, cloneTasks?: boolean;  }) {
    if (!options) { options = {}; }
    const includeCurrentTask = options.includeCurrentTask === undefined ? false : options.includeCurrentTask;
    const cloneTasks = options.cloneTasks === undefined ? false : options.cloneTasks;
    const { queue, isExecutingTask, currentTask} = this;
    // NOTA: Obtenim els elements de la cua establint-los en un nou array.
    // ISSUE: No s'ha de suministar mai una referència de la cua. Per obtenir els elements cal desestructurar l'array amb l'operador (...)
    // Altrament, les tasques acaben duplicant-se enlloc de consumir-se de la cua.
    const tasks: T[] = cloneTasks ? deepClone([...queue]) : [...queue];
    // NOTA: Si hi ha una tasca en execució és pq ja s'ha consumit de la cua (ja no hi és a l'array).
    if (includeCurrentTask && isExecutingTask && !!currentTask) {
      // Apliquem la clonació.
      const task = cloneTasks ? deepClone(currentTask) : currentTask;
      // NOTA: Afegim la tasca actual a l'array en funció de com es va consumir.
      if (this.consume === 'shift') { tasks.unshift(task) } else { tasks.push(task); }
    }
    // Retornem una còpia de la cua.
    return tasks;
  }

  /** Afegeix la tasca al principi o al final de la cua. Returns the new length of the array. */
  protected addTask(task: T) { if (this.add === 'unshift') { this.queue.unshift(task); } else { this.queue.push(task); } }

  /** Executa la següent tasca de la cua pel principi o pel final. */
  protected consumeTask(): T { return this.consume === 'shift' ? this.queue.shift() : this.queue.pop(); }

  /** Incorpora una tasca a la cua perquè sigui la següent en executar-se. Returns the new length of the array. Ex: per tornar a executar una tasca fallida. */
  protected restoreTask(task: T): number { return this.consume === 'shift' ? this.queue.unshift(task) : this.queue.push(task); }

  /** Comprova si encara hi ha tasques a la cua i no s'ha superat el límit màxim. */
  protected get hasTasksToConsume(): boolean { return !!this.queue.length && (!this.maxTasksInPeriod || (this.executedTasksInPeriod < this.maxTasksInPeriod)); }

  /** Endreça les tasques per ordre de prioritat. */
  protected sortTasksByPriority() { if (this.hasPriority) { this.queue.sort((taskA: any, taskB: any) => (taskA?.priority || 1) - (taskB?.priority || 1)); } }

  /** Indica si els elements tenen una propietat de prioritat. */
  protected get hasPriority(): boolean { return !!this.queue.length && typeof this.queue[0] === 'object' && this.queue[0].hasOwnProperty('priority'); }

  //  options
  // ---------------------------------------------------------------------------------------------------

  get run(): 'sync' | 'async' { return this.options?.run || 'sync'; }

  get add(): 'unshift' | 'push' { return this.options?.add || 'push'; }

  get consume(): 'shift' | 'pop' { return this.options?.consume || 'shift'; }

  get delay(): number { return this.options?.delay || 0; }
  
  get timeoutTaskPeriod(): number { return this.options?.timeoutTaskPeriod || 0; }

  get maxTasksCheckingPeriod(): number { return this.options?.maxTasksCheckingPeriod || 0; }

  get maxTasksInPeriod(): number { return this.options?.maxTasksInPeriod || 0; }

}


// ---------------------------------------------------------------------------------------------------
//  test
// ---------------------------------------------------------------------------------------------------
//  npx ts-node src/utils/task-executor.ts
// ---------------------------------------------------------------------------------------------------

class TestExecutor<T> extends TaskExecutor<T> {
  constructor(
    public options?: TaskExecutorOptions,
  ) {
    super(options);
    Terminal.title(`run: ${Terminal.green(this.run)}, add: ${Terminal.green(this.add)}, consume: ${Terminal.green(this.consume)}, delay: ${Terminal.green(this.delay)}`);
  }
  stringify(task: T) { return typeof task === 'object' ? JSON.stringify(task) : task; }
  doTasks(tasks: T[]): void {
    tasks.forEach(task => logTime(`do task ${this.stringify(task)}`));
    super.doTasks(tasks);
  }
  protected executeTask(task: any): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      // logTime(`exec task ${this.stringify(task)}`);
      // Simulem un consum de temps per part de la tasca.
      setTimeout(() => resolve(), 1000);
    });
  }
}

const test = (options?: TestExecutor<string>['options']) => {
  const exec = new TestExecutor<string>(options);

  const tasks: string[] = [];
  for (let i = 1; i <= 5; i++) { tasks.push(`${i}`); }
  exec.doTasks(tasks);
};

const testAsync = (options?: TestExecutor<string>['options']) => {
  const exec = new TestExecutor<string>(options);

  const tasks: string[] = [];
  for (let i = 1; i < 9; i++) { tasks.push(`${i}`); }
  exec.doTasks(tasks);

  setTimeout(() => {
    exec.doTasks(['A', 'B']);
  }, 3000);
};

interface PriorityTask extends TaskType { i: string; };

const testPriority = (options?: TestExecutor<PriorityTask>['options']) => {
  const exec = new TestExecutor<PriorityTask>(options);

  exec.on('executingTask', (result: TaskResult<PriorityTask>) => {
    console.log('executingTask => ', result.task);
  })

  exec.on('taskExecuted', (result: TaskResult<PriorityTask>) => {
    console.log('taskExecuted => ', result.task);
  })

  exec.on('taskTimeout', (result: TaskResult<PriorityTask>) => {
    console.log('taskTimeout => ', result);
  })

  const tasks: PriorityTask[] = []; 
  for (let i = 1; i <= 60; i++) {
    const range = { min: 1, max: 5 };
    const priority = Math.floor(Math.random() * (range.max - range.min + 1) + range.min);
    tasks.push({ i: `${i}`, priority, timeout: i % 2 === 0 ? 800 : 1200 });
  }
  exec.doTasks(tasks);

  setTimeout(() => {
    exec.doTasks([
      { i: 'A', priority: 2 },
      { i: 'B', priority: 1 },
      { i: 'C', priority: 3 },
      { i: 'D', priority: 4 },
      { i: 'E', priority: 5 },
    ]);
  }, 5000);
};


// ---------------------------------------------------------------------------------------------------
//  npx ts-node src/utils/task-executor.ts
// ---------------------------------------------------------------------------------------------------

// test();
// test({ consume: 'pop' });
// test({ consume: 'pop', delay: 10 });
// test({ add: 'unshift', delay: 10 });
// test({ add: 'unshift', consume: 'shift', delay: 10 });
// test({ add: 'push', consume: 'pop', delay: 10 });
// test({ add: 'unshift', consume: 'pop', delay: 10 });
// test({ add: 'push', consume: 'shift', delay: 10 });

// testAsync({ run: 'async' });
// testAsync({ run: 'async', maxTasksInPeriod: 5, maxTasksCheckingPeriod: 2 });
// testAsync({ run: 'async', maxTasksInPeriod: 4, maxTasksCheckingPeriod: 1.5 });

// testPriority({ run: 'async', maxTasksInPeriod: 5, maxTasksCheckingPeriod: 1 }); // binance orders ratio => 5/s
