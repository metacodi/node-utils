import Client from 'ftp';
import chalk from 'chalk';
import moment from 'moment';
import * as path from 'path';
import * as fs from 'fs';
import { Resource, ResourceType } from './resource';
import { Terminal } from './terminal';
import { applyFilterPattern, FilterPatternType } from './functions';


export interface FtpUploadOptions {
  continueOnError?: boolean;
  verbose?: boolean;
  ignore?: string | RegExp;
  filter?: string | RegExp;
}


/**
 * Tiny FTP client.
 *
 * ```typescript
 * const ftp = new FtpClient({ host, user, password, port });
 * await ftp.upload('test', 'www/test/');
 * await ftp.remove('www/test/').finally(() => ftp.disconnect());
 * ```
 */
export class FtpClient {
  /** The underlying Ftp Client instance. */
  protected ftp: Client;
  /** Config ftp options. */
  protected options: Client.Options;
  /** Is ready. */
  protected isReady = false;

  constructor(
    options?: Client.Options,
  ) {
    this.options = { ...this.defaultOptions, ...options };
    this.ftp = new Client();
    this.connect();
  }

  // ---------------------------------------------------------------------------------------------------
  //  connect . ready . status
  // ---------------------------------------------------------------------------------------------------

  /** Connects to an FTP server. */
  connect(connection?: Client.Options) {
    const options = { ...this.options, ...connection };
    const { host, user, password, port } = this.options;
    // console.log('connecting...', { host, user, password, port });
    this.ftp.connect({ host, user, password, port });
  }

  /** Closes FTP server connection. */
  disconnect() { this.ftp.end(); }

  /** Indicates when the client is ready. */
  ready(): Promise<boolean> {
    return new Promise<any>((resolve: any, reject: any) => {
      if (this.isReady) {
        resolve(true);
      } else {
        this.ftp.on('ready', () => { this.isReady = true, resolve(true); });
      }
    });
  }

  /** Retrieves human-readable information about the server's status. */
  get status(): Promise<string> {
    return new Promise<string>((resolve: any, reject: any) => {
      this.ftp.status((error, status) => {
        if (error) { reject(error); } else { resolve(status); }
      });
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  options
  // ---------------------------------------------------------------------------------------------------

  get host(): string { return this.options?.host; }

  get user(): string { return this.options?.user; }

  get password(): string { return this.options?.password; }

  get port(): number { return this.options?.port; }

  get defaultOptions(): Partial<Client.Options> {
    return {
      /** The port of the FTP server. Default: 21 */
      port: 21,
      /** How long (in milliseconds) to wait for the control connection to be established. Default: 10000 */
      connTimeout: 10000,
      /** How often (in milliseconds) to send a 'dummy' (NOOP) command to keep the connection alive. Default: 10000 */
      keepalive: 1000,
      /** How long (in milliseconds) to wait for a PASV data connection to be established. Default: 10000 */
      pasvTimeout: 1000,
      /**
       * Set to true for both control and data connection encryption, 'control' for control connection encryption only, or 'implicit' for
       * implicitly encrypted control connection (this mode is deprecated in modern times, but usually uses port 990) Default: false
       */
      secure: false,
      /** Additional options to be passed to tls.connect(). */
      secureOptions: undefined,
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  commands
  // ---------------------------------------------------------------------------------------------------

  /** Uploads file or directory recursively. */
  async upload(local: string, remote: string, options?: { continueOnError?: boolean; verbose?: boolean; ignore?: string | RegExp; filter?: string | RegExp; }) {
    const start = moment();
    Terminal.log(`- Uploading ${chalk.green(local)} to ${chalk.green(remote)}`);
    const result = await this.uploadAll(local, remote, options);
    const duration = moment.duration(moment().diff(start)).asSeconds();
    Terminal.success(`Uploaded ${result ? 'successfully' : 'with errors'} (${duration})`);
  }

  private async uploadAll(local: string, remote: string, options?: { continueOnError?: boolean; verbose?: boolean; ignore?: string | RegExp; filter?: string | RegExp; }) {
    if (!options) { options = {}; }
    const verbose = options.verbose === undefined ? false : options.verbose;
    const filter = options.filter === undefined ? undefined : options.filter;
    const ignore = options.ignore === undefined ? undefined : options.ignore;
    return new Promise<any>(async (resolve: any, reject: any) => {
      this.ready().then(async () => {
        remote = this.normalizeRemote(remote);
        if (this.isLocalFile(local)) {
          if (verbose) { Terminal.logInline(`  uploading... ${chalk.green(remote)}`); }
          try {
            await this.mkdir(path.dirname(remote), true);
            await this.put(local, remote);
            resolve(true);
          } catch (error) {
            if (options.continueOnError) { Terminal.error(error, false); resolve(false); } else { reject(error); }
          }
        } else {
          if (verbose) { Terminal.logInline(`  uploading... ${chalk.green(remote)}`); }
          try {
            await this.mkdir(remote, true);
            const resources = Resource.discover(local, { ignore, filter }) as ResourceType[];
            const directories = resources.filter(r => r.isDirectory);
            for (const dir of directories) { await this.uploadAll(dir.fullName, path.join(remote, dir.name), options); }
            const files = resources.filter(r => r.isFile);
            for (const file of files) { await this.uploadAll(file.fullName, path.join(remote, file.name), options); }
            resolve(true);
          } catch (error) {
            if (options.continueOnError) { Terminal.error(error, false); resolve(false); } else { reject(error); }
          }
        }
      }).catch(error => {
        if (options.continueOnError) { Terminal.error(error, false); resolve(false); } else { reject(error); }
      })
    });
  }

  /** Downloads file or directory recursively. */
  async download(remote: string, local: string, options?: { continueOnError?: boolean; verbose?: boolean; ignore?: FilterPatternType; filter?: FilterPatternType; }) {
    const start = moment();
    // Terminal.log(`- Downloading ${chalk.green(remote)} to ${chalk.green(local)}`);
    Terminal.logInline(`- Downloading ${chalk.green(remote)} to ${chalk.green(local)}`);
    const result = await this.downloadAll(remote, local, options);
    const duration = moment.duration(moment().diff(start)).asSeconds();
    // Terminal.success(`Downloaded ${result ? 'successfully' : 'with errors'} (${duration})`);
    Terminal.success(`Downloaded ${result ? 'successfully' : 'with errors'} (${duration}) ${chalk.green(remote)} to ${chalk.green(local)}`);
  }

  private async downloadAll(remote: string, local: string, options?: { continueOnError?: boolean; verbose?: boolean; ignore?: FilterPatternType; filter?: FilterPatternType; element?: Client.ListingElement; }) {
    if (!options) { options = {}; }
    const verbose = options.verbose === undefined ? false : options.verbose;
    const element = options.element === undefined ? false : options.element;
    return new Promise<any>(async (resolve: any, reject: any) => {
      this.ready().then(async () => {
        remote = this.normalizeRemote(remote);
        const enabled = !options.ignore || !applyFilterPattern(remote, options.ignore);
        const filtered = !options.filter || applyFilterPattern(remote, options.filter);
        if (enabled && filtered) {
          const isRemoteFile = element ? !this.isRemoteDirectory(element) : !!path.extname(remote);
          if (isRemoteFile) {
            if (verbose) { Terminal.logInline(`  downloading... ${chalk.green(remote)}`); }
            try {
              fs.mkdirSync(path.dirname(local), { recursive: true });
              // TODO: Apply overwriting options if file exists.
              const filePath = fs.createWriteStream(local);
              const stream = await this.get(remote);
              stream.pipe(filePath);
              filePath.on('finish', () => {
                filePath.close();
                // console.log('Download Completed');
                resolve(true);
              }).on('error', error => {
                filePath.close();
                reject(error);
              })
            } catch (error) {
              if (options.continueOnError) { Terminal.error(error, false); resolve(false); } else { reject(error); }
            }
          } else {
            if (verbose) { Terminal.logInline(`  downloading... ${chalk.green(remote)}`); }
            try {
              fs.mkdirSync(local, { recursive: true });
              const resources = await this.list(remote);
              for (const el of [...resources.filter(r => this.isRemoteDirectory(r)), ...resources.filter(r => this.isRemoteFile(r))]) {
                await this.downloadAll(path.join(remote, el.name), path.join(local, el.name), { ...options, element: el });
              }
              resolve(true);
            } catch (error) {
              if (options.continueOnError) { Terminal.error(error, false); resolve(false); } else { reject(error); }
            }
          }
        } else {
          resolve(false);
        }
      })
    });
  }

  /** Removes file or directory content and itself recursively. */
  async remove(remote: string, options?: { continueOnError?: boolean; verbose?: boolean; ignore?: string | RegExp; filter?: string | RegExp; }) {
    const start = moment();
    Terminal.log(`- Deleting ${chalk.green('www/app/')} from server`);
    const result = await this.removeAll(remote, options);
    const duration = moment.duration(moment().diff(start)).asSeconds();
    Terminal.success(`Deleted ${result ? 'successfully' : 'with errors'} (${duration})`);
  }

  private async removeAll(remote: string, options?: { continueOnError?: boolean; verbose?: boolean; }) {
    if (!options) { options = {}; }
    const verbose = options.verbose === undefined ? false : options.verbose;
    const continueOnError = options.continueOnError === undefined ? true : options.continueOnError;
    return new Promise<any>(async (resolve: any, reject: any) => {
      this.ready().then(async () => {
        try {
          remote = this.normalizeRemote(remote);
          const isFile = !!path.extname(remote);
          if (isFile) {
            if (verbose) { Terminal.logInline(`  deleting... ${chalk.green(remote)}`); }
            await this.delete(remote);
            resolve(true);
          } else {
            if (verbose) { Terminal.logInline(`  deleting... ${chalk.green(remote)}`); }
            const list = await this.list(remote);
            const directories = list.filter(r => r.type === 'd' && r.name !== '..' && r.name !== '.').map(r => path.posix.join(remote, r.name));
            const files = list.filter(r => r.type !== 'd').map(r => path.posix.join(remote, r.name));
            // OPCIÓ 1: Totalment seqüencial
            // 1. delete sub-directories and then all files.
            for (const dir of directories) { await this.removeAll(dir, options); }
            // 2. deletes everything in sub-directory.
            for (const file of files) { await this.removeAll(file, options); }
            // 3. deletes directory itself.
            await this.rmdir(remote, false, { continueOnError });
            resolve(true);
            // // ERROR: There are too many connections from your internet address.
            // Promise.all([
            //   ...directories.map(dir => this.removeAll(dir, options)),
            //   ...files.map(file => this.removeAll(file, options)),
            // ]).then(() => this.rmdir(remote, false).then(() => resolve(true)));
          }
        } catch (error) {
          if (continueOnError) { Terminal.error(error, false); resolve(false); } else { reject(error); }
        }
      });
    });
  }

  /** Creates a new directory, path, on the server. */
  mkdir(remote: string, recursive?: boolean): Promise<boolean> {
    if (recursive === undefined) { recursive = true; }
    return new Promise<boolean>((resolve: any, reject: any) => {
      this.ready().then(async () => {
        remote = this.normalizeRemote(remote);
        if (remote === '/') {
          resolve(false);
        } else {
          this.ftp.mkdir(remote, recursive, error => {
            if (error) { reject(error); } else { resolve(true); }
          });
        }
      });
    });
  }

  /** Removes a directory, path, on the server. If recursive, this call will delete the contents of the directory if it is not empty. */
  rmdir(remote: string, recursive: boolean, options?: { continueOnError?: boolean; }): Promise<boolean> {
    if (!options) { options = {}; }
    const continueOnError = options.continueOnError === undefined ? false : options.continueOnError;
    return new Promise<boolean>((resolve: any, reject: any) => {
      this.ready().then(async () => {
        remote = this.normalizeRemote(remote);
        if (remote === '/') {
          resolve(false);
        } else {
          this.ftp.rmdir(remote, recursive, error => {
            if (error) {
              if (continueOnError) { Terminal.error(error, false); resolve(false); } else { reject(error); }
            } else {
              resolve(true);
            }
          });
        }
      });
    });
  }

  /** Retrieves a file at path from the server. useCompression defaults to false. */
  get(remote: string): Promise<NodeJS.ReadableStream> {
    return new Promise<NodeJS.ReadableStream>((resolve: any, reject: any) => {
      remote = this.normalizeRemote(remote);
      this.ftp.get(remote, (error, stream) => {
        if (error) { reject(error); } else { resolve(stream); }
      });
    });
  }

  /** Sends data to the server to be stored as destPath. */
  put(local: string, remote: string): Promise<boolean> {
    return new Promise<boolean>((resolve: any, reject: any) => {
      this.ftp.put(local, this.normalizeRemote(remote), error => {
        if (error) { reject(error); } else { resolve(true); }
      });
    });
  }

  /** Delete a file on the server. */
  delete(remote: string): Promise<boolean> {
    return new Promise<any>((resolve: any, reject: any) => {
      this.ready().then(async () => {
        this.ftp.delete(this.normalizeRemote(remote), error => {
          if (error) { reject(error); } else { resolve(true); }
        });
      });
    });
  }

  /** Retrieves the directory listing of path. */
  list(remote?: string): Promise<Client.ListingElement[]> {
    return new Promise<Client.ListingElement[]>(async (resolve: any, reject: any) => {
      this.ready().then(async () => {
        remote = this.normalizeRemote(remote);
        if (!remote) { remote = await this.pwd(); }
        this.ftp.list(remote, (error, list) => {
          if (error) { reject(error); } else { resolve(list); }
        });
      });
    });
  }

  /** Retrieves the current working directory. */
  pwd(): Promise<string> {
    return new Promise<string>((resolve: any, reject: any) => {
      this.ready().then(async () => {
        this.ftp.pwd((error, remote) => {
          if (error) { reject(error); } else { resolve(remote); }
        });
      });
    });
  }

  /** Aborts the current data transfer (e.g. from get(), put(), or list()). */
  abort(): Promise<void> {
    return new Promise<void>((resolve: any, reject: any) => {
      this.ready().then(async () => {
        this.ftp.abort((error) => {
          if (error) { reject(error); } else { resolve(); }
        });
      });
    });
  }

  /** Sets the transfer data type to ASCII. */
  ascii(): Promise<void> {
    return new Promise<void>((resolve: any, reject: any) => {
      this.ready().then(async () => {
        this.ftp.ascii((error) => {
          if (error) { reject(error); } else { resolve(); }
        });
      });
    });
  }

  /** Sets the transfer data type to binary (default at time of connection). */
  binary(): Promise<void> {
    return new Promise<void>((resolve: any, reject: any) => {
      this.ready().then(async () => {
        this.ftp.binary((error) => {
          if (error) { reject(error); } else { resolve(); }
        });
      });
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  helpers
  // ---------------------------------------------------------------------------------------------------

  /** Returns path with separators as `/`. */
  normalizeRemote(resource: string) { return path.normalize(resource).replace(new RegExp('\\\\', 'g'), '/'); }

  /** Check if remote path is a directory. */
  isRemoteDirectory(el: Client.ListingElement): boolean { return el.type === 'd' && el.name !== '.' && el.name !== '..'; }

  /** Check if remote path is a file. */
  isRemoteFile(el: Client.ListingElement): boolean { return el.type === '-'; }

  /** Check if local path is a directory. */
  isLocalDirectory(resource: string) { return fs.lstatSync(resource).isDirectory(); }

  /** Check if local path is a file. */
  isLocalFile(resource: string) { return fs.lstatSync(resource).isFile(); }

}