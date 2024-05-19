import moment from 'moment';

import { deepClone } from './deep-merge';
import { logTime } from '../functions/functions';
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
  /** Limita el nombre de tasques que es podran executar durant el periode actual. */
  maxTasksInPeriod?: number;
  maxTasksCheckingPeriod?: number;
};

export abstract class TaskExecutor {
  /** Cua de tasques.
   *
   * NOTA: És una propietat privada per evitar referències externes que poden ocasionar problemes de consum i acabar generant duplicitat de tasques a la cua.
   */
  private queue: any[] = [];
  /** Indica quan hi ha una tasca en execució. */
  isExecutingTask = false;
  /** Referència a la tasca actualment en execució. */
  currentTask: any = undefined;
  /** Indica si l'execució asíncrona de la cua està suspesa per un període determinat. */
  isSleeping = false;
  /** Indica quan l'execució de la cua està en pausa per una crida a `pauseQueue()`. */
  isExecutionPaused = false;
  /** Indica quan hi ha una operació d'actualització de límits a l'espera. */
  changeLimitsPending = false;
  /** Quantitat de consultes realitzades durant el periode actual. */
  executedTasksInPeriod = 0;
  /** @hidden */
  private maxTasksCheckingSubscription: NodeJS.Timer = undefined;

  constructor(
    public options?: TaskExecutorOptions,
  ) {
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

  /** @deprecated Utilitzar `doTasks()` com a alternativa. */
  do(task: any) {
    // Afegim la tasca a la cua.
    this.addTask(task);
    // Endrecem les tasques per prioritat.
    if (this.hasPriority) { this.sortTasksByPriority(); }
    // Provem d'executar la tasca.
    this.executeQueue();
  }

  doTask(task: any) {
    // Afegim la tasca a la cua.
    this.addTask(task);
    // Endrecem les tasques per prioritat.
    if (this.hasPriority) { this.sortTasksByPriority(); }
    // Provem d'executar la tasca.
    this.executeQueue();
  }

  doTasks(tasks: any[]) {
    if (!Array.isArray(tasks)) { tasks = !tasks ? [] : [tasks]; }
    // Afegim les tasques a la cua.
    ((tasks || []) as any[]).forEach(task => this.addTask(task));
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
          this.currentTask = task;
          if (this.maxTasksInPeriod > 0) { this.executedTasksInPeriod += 1; }
          this.executeTask(task);
        }
        // Restablim l'indicador d'estat per desblocar la cua.
        this.isExecutingTask = false;
        this.currentTask = undefined;
      }
    }
  }

  /** Procediment que s'ha d'implementar a la classe heredada. */
  protected abstract executeTask(task: any): Promise<any>;

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
    this.currentTask = task;
    // Incrementem el comptador.
    if (this.maxTasksInPeriod > 0) { this.executedTasksInPeriod += 1; }
    // Esperem el callback per garantir un procés seqüencial.
    this.executeTask(task).finally(() => {
      // Restablim l'indicador d'estat per desblocar la cua.
      this.isExecutingTask = false;
      this.currentTask = undefined;
      // Mentre quedin tasques s'aniran consumint de la cua.
      this.executeQueue();
    });
  }

  //  async: execució en paral·lel amb control de tasques per periode
  // ---------------------------------------------------------------------------------------------------
  //  NOTA: L'interval s'activa quan s'estableix l'opció `maxTasksInPeriod > 0`.

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
    // IMPORTANT: No s'ha de suministar mai una referència de la cua. Per obtenir els elements cal desestructurar l'array amb l'operador (...)
    // Altrament, les tasques acaben duplicant-se enlloc de consumir-se de la cua.
    const tasks: any[] = cloneTasks ? deepClone([...queue]) : [...queue];
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

  /** Afegeix la tasca al principi o al final de la cua. */
  protected addTask(task: any) { if (this.add === 'unshift') { this.queue.unshift(task); } else { this.queue.push(task); } }

  /** Executa la següent tasca de la cua pel principi o pel final. */
  protected consumeTask(): any { return this.consume === 'shift' ? this.queue.shift() : this.queue.pop(); }

  /** Incorpora una tasca a la cua perquè sigui la següent en executar-se. Ex: per tornar a executar una tasca fallida. */
  protected restoreTask(task: any): any { return this.consume === 'shift' ? this.queue.unshift(task) : this.queue.push(task); }

  /** Comprova si encara hi ha tasques a la cua i no s'ha superat el límit màxim. */
  protected get hasTasksToConsume(): boolean { return !!this.queue.length && (!this.maxTasksInPeriod || (this.executedTasksInPeriod < this.maxTasksInPeriod)); }

  /** Endreça les tasques per ordre de prioritat. */
  protected sortTasksByPriority() { this.queue.sort((taskA: any, taskB: any) => (taskA?.priority || 1) - (taskB?.priority || 1)); }

  /** Indica si els elements tenen una propietat de prioritat. */
  protected get hasPriority(): boolean { return !!this.queue.length && typeof this.queue[0] === 'object' && this.queue[0].hasOwnProperty('priority'); }

  //  options
  // ---------------------------------------------------------------------------------------------------

  get run(): 'sync' | 'async' { return this.options?.run || 'sync'; }

  get add(): 'unshift' | 'push' { return this.options?.add || 'push'; }

  get consume(): 'shift' | 'pop' { return this.options?.consume || 'shift'; }

  get delay(): number { return this.options?.delay || 0; }

  get maxTasksCheckingPeriod(): number { return this.options?.maxTasksCheckingPeriod || 0; }

  get maxTasksInPeriod(): number { return this.options?.maxTasksInPeriod || 0; }

}


// ---------------------------------------------------------------------------------------------------
//  test
// ---------------------------------------------------------------------------------------------------
//  npx ts-node src/utils/task-executor.ts
// ---------------------------------------------------------------------------------------------------

class TestTaskExecutor extends TaskExecutor {
  constructor(
    public options?: TaskExecutorOptions,
  ) {
    super(options);
    Terminal.title(`run: ${Terminal.green(this.run)}, add: ${Terminal.green(this.add)}, consume: ${Terminal.green(this.consume)}, delay: ${Terminal.green(this.delay)}`);
  }
  stringify(task: any) { return typeof task === 'object' ? JSON.stringify(task) : task; }
  doTasks(tasks: any[]): void {
    tasks.forEach(task => logTime(`do task ${this.stringify(task)}`));
    super.doTasks(tasks);
  }
  protected executeTask(task: any): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      logTime(`exec task ${this.stringify(task)}`);
      // Simulem un consum de temps per part de la tasca.
      setTimeout(() => resolve(), 100);
    });
  }
}

const test = (options?: TaskExecutor['options']) => {
  const exec = new TestTaskExecutor(options);

  const tasks = [];
  for (let i = 1; i <= 5; i++) { tasks.push(`${i}`); }
  exec.doTasks(tasks);
};

const testAsync = (options?: TaskExecutor['options']) => {
  const exec = new TestTaskExecutor(options);

  const tasks = [];
  for (let i = 1; i < 9; i++) { tasks.push(`${i}`); }
  exec.doTasks(tasks);

  setTimeout(() => {
    exec.doTasks(['A', 'B']);
  }, 3000);
};

const testPriority = (options?: TaskExecutor['options']) => {
  const exec = new TestTaskExecutor(options);

  const tasks = []; 
  for (let i = 1; i <= 60; i++) {
    const range = { min: 1, max: 5 };
    const priority = Math.floor(Math.random() * (range.max - range.min + 1) + range.min);
    tasks.push({ i, priority });
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
