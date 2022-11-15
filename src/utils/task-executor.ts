import moment from 'moment';


const timestamp = (inp?: moment.MomentInput) => moment(inp).format('YYYY-MM-DD HH:mm:ss.SSS');

const logTime = (message?: any, ...optionalParams: any[]): void => console.log(`${timestamp()} -> ${message}`, ...optionalParams);

export type LimitType = 'request' | 'trade';

export interface Limit {
  type: LimitType;
  maxQuantity: number;
  period: number;
  unitOfTime?: moment.unitOfTime.DurationAs;
}

export interface Interval {
  period: number;
  unitOfTime?: moment.unitOfTime.DurationAs;
}

export interface TaskExecutorOptions {
  add?: 'unshift' | 'push';
  consume?: 'shift' | 'pop';
  run?: 'sync' | 'async';
  delay?: number;
  maxQuantity?: number;
  period?: number;
};

export abstract class TaskExecutor {
  /** Cua de tasques. */
  queue: any[] = [];
  /** Indicador d'estat per l'accés a la cua. */
  executingTask = false;
  isSleeping = false;
  /** Indica quan hi ha una operació d'actualització de límits a l'espera. */
  changeLimitsPending = false;
  /** Quantitat de consultes realitzades durant el periode actual. */
  countPeriod = 0;
  /** @hidden */
  intervalSubscription: NodeJS.Timer = undefined;

  constructor(
    public options?: TaskExecutorOptions,
  ) {
    if (!options) { options = {}; }
    if (options.run === undefined) { options.run = 'sync'; }
    if (options.add === undefined) { options.add = 'push'; }
    if (options.consume === undefined) { options.consume = 'shift'; }
    if (options.delay === undefined) { options.delay = 0; }
    if (options.maxQuantity === undefined) { options.maxQuantity = 0; }
    if (options.period === undefined) { options.period = 0; }
    // console.log(JSON.stringify(options) + '\n');
    this.options = options;
  }

  do(task: any) {
    // Afegim la tasca a la cua.
    this.addTask(task);
    // Provem d'executar la tasca.
    this.executeQueue();
  }

  protected executeQueue() {
    // Evitem els solapaments mentre s'executa una altra tasca.
    if (this.executingTask) { return; }
    // Mentre existeixin tasques pendents i no haguem superat el màxim limitat.
    if (this.hasTasksToConsume) {
      // Si l'interval s'havia aturat, l'iniciem de nou.
      if (!!this.maxQuantity && !this.isTaskIntervalOn) { this.startTasksInterval(); }
      // Establim l'indicador d'estat per blocar l'accés a la cua.
      this.executingTask = true;

      if (this.run === 'sync') {
        // sync: seqüencial
        if (this.delay) { setTimeout(() => this.nextTask(), this.delay); } else { this.nextTask(); }

      } else {
        // async: paral·lel
        while (this.hasTasksToConsume && !this.isSleeping) {
          // Executem la següent tasca de la cua.
          const task = this.consumeTask();
          if (!!this.period) { this.countPeriod += 1; }
          this.executeTask(task);
        }
        // Restablim l'indicador d'estat per desblocar la cua.
        this.executingTask = false;
      }
    }
  }

  /** Procediment que s'ha d'implementar a la classe heredada. */
  protected abstract executeTask(task: any): Promise<any>;

  //  sync: execució seqüencial
  // ---------------------------------------------------------------------------------------------------

  protected nextTask(): void {
    // Executem la següent tasca de la cua pel principi o pel final.
    const task = this.consumeTask();
    // Incrementem el comptador.
    if (!!this.period) { this.countPeriod += 1; }
    // Esperem el callback per garantir un procés seqüencial.
    this.executeTask(task).finally(() => {
      // Restablim l'indicador d'estat per desblocar la cua.
      this.executingTask = false;
      // Mentre quedin tasques s'aniran consumint de la cua.
      this.executeQueue();
    });
  }

  //  async: execució en paral·lel
  // ---------------------------------------------------------------------------------------------------

  protected startTasksInterval() {
    const { period } = this; // [s]
    // logTime('----------- START interval', period);
    // if (this.intervalSubscription !== undefined) { this.intervalSubscription.unsubscribe(); }
    if (this.intervalSubscription !== undefined) { clearInterval(this.intervalSubscription); }
    this.countPeriod = 0;
    // this.intervalSubscription = interval(period * 1000).subscribe(() => this.processTasksInterval());
    this.intervalSubscription = setInterval(() => this.processTasksInterval(), period * 1000);
  }

  protected stopTasksInterval() {
    // logTime('STOP interval\n');
    // if (this.intervalSubscription !== undefined) { this.intervalSubscription.unsubscribe(); }
    if (this.intervalSubscription !== undefined) { clearInterval(this.intervalSubscription); }
    this.intervalSubscription = undefined;
  }

  protected sleepTasksInterval(period?: number) {
    if (!period) { period = 10; }
    this.isSleeping = true;
    // Aturem l'interval.
    this.stopTasksInterval();
    // Restablim el comptador de tasques de l'interval.
    this.countPeriod = 0;
    // Restablim l'indicador d'estat per desblocar la cua.
    this.executingTask = false;
    // Esperem un temps prudencial abans de tornar a executar la cua.
    setTimeout(() => {
      this.isSleeping = false;
      this.executeQueue();
    }, period * 1000);
  }

  protected processTasksInterval() {
    // logTime('----------- interval');
    // Si hi ha una operació de canvi de límits pendent, ara és l'hora de fer el canvi.
    if (this.changeLimitsPending) { this.changeLimitsPending = false; this.stopTasksInterval(); return this.executeQueue(); }
    // Comprovem si s'ha executat alguna tasca.
    if (this.countPeriod > 0) {
      // Inicialitzem el comptador.
      this.countPeriod = 0;
      // Endrecem les tasques per prioritat.
      if (this.hasPriority) { this.sortTasksByPriority(); }
      // S'ha esgotat el periode, tornem a llançar la cua.
      this.executeQueue();
    } else {
      // Hi ha hagut tot un periode sense cap execució.
      return this.stopTasksInterval();
    };
  }

  protected get isTaskIntervalOn(): boolean { return this.intervalSubscription !== undefined; }

  //  limits
  // ---------------------------------------------------------------------------------------------------

  updateLimit(limit: Limit) { Object.assign(this.options || {}, limit); this.changeLimitsPending = this.isTaskIntervalOn; }


  //  queue
  // ---------------------------------------------------------------------------------------------------

  /** Afegeix la tasca al principi o al final de la cua. */
  protected addTask(task: any) { if (this.add === 'unshift') { this.queue.unshift(task); } else { this.queue.push(task); } }

  /** Executa la següent tasca de la cua pel principi o pel final. */
  protected consumeTask(): any { return this.consume === 'shift' ? this.queue.shift() : this.queue.pop(); }

  /** Incorpora una tasca fallida a la cua perquè es torni a executar. */
  protected tryAgainTask(): any { return this.consume === 'shift' ? this.queue.unshift() : this.queue.push(); }

  /** Comprova si encara hi ha tasques a la cua i no s'ha superat el límit màxim. */
  protected get hasTasksToConsume(): boolean { return !!this.queue.length && (!this.maxQuantity || (this.countPeriod < this.maxQuantity)); }

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

  get period(): number { return this.options?.period || 0; }

  get maxQuantity(): number { return this.options?.maxQuantity || 0; }

}


// ---------------------------------------------------------------------------------------------------
//  test
// ---------------------------------------------------------------------------------------------------
//  npx ts-node task-executor.ts
// ---------------------------------------------------------------------------------------------------

class TestTaskExecutor extends TaskExecutor {
  stringify(task: any) { return typeof task === 'object' ? JSON.stringify(task) : task; }
  do(task: any): void {
    logTime(`do task ${this.stringify(task)}`);
    super.do(task);
  }
  protected executeTask(task: any): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      logTime(`exec task ${this.stringify(task)}`);
      setTimeout(() => {
        resolve();
      }, 100);
    });
  }
}

const test = (options?: TaskExecutor['options']) => {
  const exec = new TestTaskExecutor(options);
  for (let i = 1; i <= 5; i++) { exec.do(`${i}`);}
};

const testAsync = (options?: TaskExecutor['options']) => {
  const exec = new TestTaskExecutor(options);
  for (let i = 1; i < 9; i++) { exec.do(`${i}`);}
  setTimeout(() => {
    exec.do('A');
    exec.do('B');
  }, 9000);
};

const testPriority = (options?: TaskExecutor['options']) => {
  const exec = new TestTaskExecutor(options);
  const rmin = 1;
  const rmax = 5;
  for (let i = 1; i <= 60; i++) {
    const priority = Math.floor(Math.random() * (rmax - rmin + 1) + rmin);
    exec.do({ i, priority });
  }
  setTimeout(() => {
    exec.do({ i: 'A', priority: 2 });
    exec.do({ i: 'B', priority: 1 });
    exec.do({ i: 'C', priority: 3 });
    exec.do({ i: 'D', priority: 4 });
    exec.do({ i: 'E', priority: 5 });
  }, 5000);
};

// test();
// test({ consume: 'pop' });
// test({ consume: 'pop', delay: 10 });
// test({ add: 'unshift', delay: 10 });
// test({ add: 'unshift', consume: 'shift', delay: 10 });
// test({ add: 'push', consume: 'pop', delay: 10 });
// test({ add: 'unshift', consume: 'pop', delay: 10 });
// test({ add: 'push', consume: 'shift', delay: 10 });

// testAsync({ run: 'async' });
// testAsync({ run: 'async', maxQuantity: 5, period: 2 });
// testAsync({ run: 'async', maxQuantity: 4, period: 1.5 });

// testPriority({ run: 'async', maxQuantity: 5, period: 1 }); // binance orders ratio => 5/s



