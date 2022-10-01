import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { Terminal } from './terminal';
import { applyFilterPattern, FilterPatternType } from './functions';
import moment from 'moment';


export interface ResourceType {
  name: string;
  path: string;
  fullName: string;
  size?: number;
  created?: Date;
  modified?: Date;
  isDirectory: boolean;
  isFile: boolean;
  extension: string;
  children?: ResourceType[];
}

/**
 *
 */
export class Resource {

  /** Encadena amb una barra (`/`) la ruta i l'arxiu indicats.
   * @category Path
   */
  static concat(folder: string, fileName: string): string {
    if (!folder) { return fileName; }
    if (!fileName) { return folder; }
    const concat = (folder.endsWith('/') || folder.endsWith('\\')) ? '' : '/';
    const file = (fileName.startsWith('/') || fileName.startsWith('\\')) ? fileName.substring(1) : fileName;
    return Resource.normalize(folder + concat + file);
  }

  /** Substitueix totes les barres per contra-barres.
   * @category Path
   */
   static normalize(fileName: string): string {
    const find = process.platform === 'win32' ? '/' : '\\\\';
    // const replace = process.platform === 'win32' ? '\\' : '/';
    const replace = Resource.platformPathSeparator;
    return fileName.replace(new RegExp(find, 'g'), replace);
  }

  /** Retorna un array amb els segments del camí indicat.
   * @category value
   */
  static split(value: string): string[] {
    return Resource.normalize(value).replace('\\', '/').split('/');
  }

  /** Retorna un camí a partir dels seus segments normalitzat per la plataforma actual.
   * @category values
   */
  static join(values: string[]): string {
    return Resource.normalize(values.join('/'));
  }

  /** Obté el caràcter separador de carpetes que fa servir la plataforma actual.
   * @category Path
   */
  static get platformPathSeparator(): string {
    return process.platform === 'win32' ? '\\' : '/';
  }

  /** Adjunta el contingut a l'arxiu indicat. */
  static appendFile(fileName: string, content: string, options?: { encoding?: BufferEncoding; }): void {
    if (!options) { options = {}; }
    const encoding: BufferEncoding = options.encoding === undefined ? 'utf8' : options.encoding;
    fs.appendFileSync(fileName, content, { encoding });
  }

  /**
   * Llegeix el contingut d'un arxiu i intenta parsejar-lo comprovant l'extensió.
   *
   * Per exemple, si l'arxiu és un de tipus `json` aleshores es retorna el resultat de `JSON.parse(content)`.
   */
  static open(fileName: string, options?: { parseJsonFile?: boolean; wrapAsArray?: boolean; encoding?: BufferEncoding; }): any {
    if (!options) { options = {}; }
    const encoding: BufferEncoding = options.encoding === undefined ? 'utf8' : options.encoding;

    // Obtenim el contingut de l'arxiu.
    let content = fs.readFileSync(fileName, { encoding }).toString();

    // Parsejem el contingut.
    const file = Resource.discover(fileName) as ResourceType;
    if (options.parseJsonFile === true || (options.parseJsonFile === undefined && file.extension === '.json')) {
      try {
        if (file.name.startsWith('tsconfig')) {
          // Remove comments.
          content = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');
          // Eliminem la coma de la darrera propietat d'un objecte literal.
          content = content.replace(/\,[\s]*\}/gm, '}');
          // Eliminem la coma del darrer element d'un array.
          content = content.replace(/\,[\s]*\]/gm, ']');
        }
        return JSON.parse(options.wrapAsArray ? `[${content}]` : content);

      } catch (err) {
        Terminal.error(`Error parsejant l'arxiu JSON '${Terminal.file(fileName)}'.`, false);
        return undefined;
      }
    }
    return content;
  }

  /**
   * Guarda el contingut en l'arxiu i intenta formatejar-lo abans comprovant l'extensió.
   *
   * Per exemple, si l'arxiu és un de tipus `json` aleshores abans es guardar
   * el contingut es transforma fent `JSON.stringify(content)`
   */
  static save(fileName: string, content: any, options?: fs.WriteFileOptions): boolean {
    try {
      if (!options) { options = {}; }

      if (Resource.exists(fileName)) {
        // Parsejem el contingut.
        const file = Resource.discover(fileName) as ResourceType;
        if (file.extension === '.json' && typeof content === 'object') {
          content = JSON.stringify(content, null, 2);
        }
      }

      fs.writeFileSync(fileName, content, options);
      return true;

    } catch (err) {
      Terminal.error(`Error parsejant l'arxiu JSON '${Terminal.file(fileName)}'.`, false);
      return false;
    }
  }

  /** Indica si un recurs existeix. */
  static exists(resource: string): boolean {
    try { return fs.existsSync(resource); } catch (err) { return false; }
  }
  /** Indica si un recurs existeix i a més és accessible. */
  static isAccessible(resource: string): boolean {
    try { fs.accessSync(resource, fs.constants.F_OK); return true; } catch (err) { return false; }
  }
  /** Indica si l'usuari actual té permisos de lectura sobre el recurs. */
  static isReadable(resource: string): boolean {
    try { fs.accessSync(resource, fs.constants.R_OK); return true; } catch (err) { return false; }
  }
  /** Indica si l'usuari actual té permisos d'escritura sobre el recurs. */
  static isWriteable(resource: string): boolean {
    try { fs.accessSync(resource, fs.constants.W_OK); return true; } catch (err) { return false; }
  }
  /** Indica si el recurs només es pot llegir, però no modificar. */
  static isReadOnly(resource: string): boolean {
    return this.isAccessible(resource) && this.isReadable(resource) && !this.isWriteable(resource);
  }

  /** Check if local path is a directory. */
  static isDirectory(resource: string) { return fs.lstatSync(resource).isDirectory(); }

  /** Check if local path is a file. */
  static isFile(resource: string) { return fs.lstatSync(resource).isFile(); }

  /**
   * Obté informació detallada de les carpetes i els arxius del directori actual.
   * ```typescript
   * const info: ResourceType = Resource.discover(path.join(Prompt.directory, 'tsconfig.json'));
   * ```
   * Valor retornat:
   * ```json
   * {
   *   "name": "tsconfig.json",
   *   "path": "C:/Users/Jordi/work/metacodi/tools/meta-model",
   *   "fullName": "C:/Users/Jordi/work/metacodi/tools/meta-model/tsconfig.json",
   *   "isDirectory": false,
   *   "isFile": true,
   *   "extension": ".json",
   *   "size": 1035,
   *   "created": "2020-06-15T13:37:16.891Z",
   *   "modified": "2020-06-18T10:59:27.228Z"
   * }
   * ```
   * @param resource Ruta absoluta del recurs que es vol explorar.
   * @param ignore Expressió regular per escloure arxius i carpetes.
   * @param recursive Realitza crides recursives fins descobrir tots els recursos de dins les sub-carpetes.
   */
  static discover(resource: string, options?: { ignore?: FilterPatternType, filter?: FilterPatternType, recursive?: boolean }, indent = ''): ResourceType | ResourceType[] {
    if (!options) { options = {}; }
    if (options.ignore === undefined) { options.ignore = 'node_modules|\.git'; }
    if (options.recursive === undefined) { options.recursive = false; }
    if (!!options.ignore && typeof options.ignore === 'string') { options.ignore = new RegExp(options.ignore); }
    if (!!options.filter && typeof options.filter === 'string') { options.filter = new RegExp(options.filter); }

    if (!fs.existsSync(resource) || !Resource.isAccessible(resource)) { Terminal.error(`No existeix el recurs '${Terminal.file(resource)}'`); return []; }

    const content: ResourceType[] = [];
    const resourceIsDirectory = fs.lstatSync(resource).isDirectory();
    // NOTA: Si el recurs és la unitat, afegim una barra pq sinó accedirà a la carpeta actual process.cwd() i no trobarà aquests arxius a l'arrel de la unitat.
    if (resource.length === 2 && resource.endsWith(':')) resource += (process.platform === 'win32' ? '\\' : '/');
    const resources: string[] = resourceIsDirectory ? fs.readdirSync(resource) : [ path.basename(resource) ];
    resource = resourceIsDirectory ? resource : path.dirname(resource);

    for (const name of Object.values(resources)) {
      const fullName = path.join(resource, name);
      try {
        // NOTA: Encara que sigui accessible, no podem recuperar el seu status si no ho permeten els permisos.
        const accessible = Resource.isAccessible(fullName);
        const enabled = !options.ignore || !applyFilterPattern(name, options.ignore);
        const filtered = !options.filter || applyFilterPattern(name, options.filter);
        if (accessible && enabled && filtered) {
          const stat: fs.Stats = fs.statSync(fullName);
          const info: ResourceType = {
            name,
            path: resource,
            fullName,
            isDirectory: stat.isDirectory(),
            isFile: stat.isFile(),
            extension: stat.isDirectory() ? '' : path.extname(name),
            size: stat.size,
            created: stat.birthtime,
            modified: stat.mtime,
          };
          // console.log(indent + (info.isDirectory ? '+ ' : '  ') + info.name + ' (' + info.size + ')');
          // Si el recurs era un arxiu, sortirem desrpés de la primera volta retornant un objecte en lloc d'un array.
          if (resourceIsDirectory) { content.push(info); } else { return info; }
          // -> Crida recursiva
          if (info.isDirectory && options.recursive) { info.children = this.discover(fullName, options, indent + '  ') as ResourceType[]; }
        }
      } catch (error) {
        // console.error(error);
      }
    }
    return content;
  }

  /** Copia síncronament un arxiu o bé una carpeta i el seu contingut.
   *
   * Aquesta funció delega `copyFileSync` i `copyFolderSync` i la seva tasca principal rau en escriure el resultat per consola.
   * Si s'activa l'argument `options.verbose` escriu tot el procés (ho fa sobrescrivint en una sóla línia, sense provocar scroll).
   * @param options.createFolderInTarget Si la font és un directori, indica si es crearà la carpeta al destí o bé si només s'hi copiarà el seu contingut. Per defecte és `true`.
   */
  static copy(source: string, target: string, options?: { filter?: FilterPatternType, createFolderInTarget?: boolean, verbose?: boolean }) {
    const start = moment();
    // Terminal.log(`- Copying ${chalk.green(source)} to ${chalk.green(target)}`);
    Terminal.logInline(`- Copying ${chalk.green(source)} to ${chalk.green(target)}`);
    if (fs.lstatSync(source).isDirectory()) {
      const duration = moment.duration(moment().diff(start)).asSeconds();
      const result = Resource.copyFolderSync(source, target, options);
      Terminal.success(`Copied ${result ? 'successfully' : 'with errors'} (${duration})`);
    } else {
      Resource.copyFileSync(source, target, options);
      Terminal.success(`Copied successfully ${chalk.green(target)}`);
    }
  }


  /** Copia un arxiu de manera síncrona utilitzant `fs.writeFileSync()`.
   *
   * S'utilitza conjuntament amb la funció `copyFolderSync()`.
   * @param source Carpeta d'origen de la còpia.
   * @param target Carpeta de destí de la còpia. Veure com li afecta el paràmetr d'opció `createFolderInTarget`.
   * @param options.verbose Indica si s'imprimirà informació del procés per la consola del terminal.
   */
  static copyFileSync(source: string, target: string, options?: { verbose?: boolean }, indent = ''): void {
    if (!options) { options = {}; }
    // if (options.verbose === undefined) { options.verbose = false; }
    const verbose = options.verbose === undefined ? Terminal.verboseEnabled : !!options.verbose;

    const file = path.basename( source );
    // if (verbose) { console.log(indent + chalk.green('√'), file); }
    if (verbose) { Terminal.logInline(`  copying... ${chalk.green(file)}`); }

    let targetFile = target;

    // If target is a directory a new file with the same name will be created
    if (fs.existsSync(target)) {
      if (fs.lstatSync(target).isDirectory()) {
        targetFile = path.join(target, path.basename(source));
      }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
  }

  /**
   * Copia una carpeta i el seu contingut de forma recursiva.
   *
   * S'utilitza conjuntament amb la funció `copyFileSync()`.
   * @param source Carpeta d'origen de la còpia.
   * @param target Carpeta de destí de la còpia. Veure com li afecta el paràmetr d'opció `createFolderInTarget`.
   * @param options.filter Indica una expressió regular o bé una funció que s'utilitzarà per filtrar els elements copiats.
   * ```typescript
   * type FilterPatternType = string | RegExp | ((pattern: string) => boolean) | { test: (pattern: string) => boolean };
   * ```
   * @param options.createFolderInTarget Indica si es crearà la carpeta al destí o bé s'hi copiarà només el seu contingut. Per defecte és `true`.
   * @param options.verbose Indica si s'imprimirà informació del procés per la consola del terminal.
   */
  static copyFolderSync(source: string, target: string, options?: { filter?: FilterPatternType, createFolderInTarget?: boolean, verbose?: boolean }, indent = ''): number {
    if (!options) { options = {}; }
    const filter = options.filter === undefined ? '' : options.filter;
    const createFolderInTarget = options.createFolderInTarget === undefined ? true : options.createFolderInTarget;
    const verbose = options.verbose === undefined ? Terminal.verboseEnabled : !!options.verbose;
    /** indent funciona como el nuevo valor (para pasarlo a los hijos) mientras que options.indent contiene el valor actual. */
    const files: any[] = [];

    // Check if folder needs to be created or integrated
    const targetFolder = createFolderInTarget ? path.join(target, path.basename(source)) : target;
    if (!fs.existsSync(targetFolder)) { fs.mkdirSync(targetFolder); }
    // if (verbose && createFolderInTarget) { console.log(indent + '> ' + chalk.bold(path.basename(source))); }

    // Copy
    let copied = 0;
    if (fs.lstatSync(source).isDirectory()) {
      // Obtenim els arxius i carpetes.
      files.push(...fs.readdirSync(source));
      // 1º processem els directoris.
      files.forEach((file: any) => {
        const origin = path.join(source, file);
        if (fs.lstatSync(origin).isDirectory()) {
          if (applyFilterPattern(origin, filter) && Resource.hasFilteredFiles(origin, filter)) {
            if (verbose) { Terminal.logInline(`  copying... ${chalk.green(origin)}`); }
            copied += Resource.copyFolderSync(origin, targetFolder, { verbose, filter }, indent + '  ');
          } else {
            // if (verbose) { console.log(Terminal.orangered(indent + '  - ' + file)); }
            if (verbose) { Terminal.logInline(`  ignored... ${chalk.redBright(file)}`); }
          }
        }
      });
      // 2º processem els arxius.
      files.forEach((file: any) => {
        const origin = path.join(source, file);
        if (!fs.lstatSync(origin).isDirectory()) {
          if (applyFilterPattern(origin, filter)) {
            Resource.copyFileSync(origin, targetFolder, { verbose }, indent + '  ');
            copied++;
          } else {
            // if (verbose) { console.log(Terminal.orangered(indent + '  - ' + file)); }
            if (verbose) { Terminal.logInline(`  ignored... ${chalk.redBright(file)}`); }
          }
        }
      });
    }
    return copied;
  }

  /** Elimina un arxiu o una carpeta i tot el seu contingut.
   *
   * ```typescript
   * interface fs.RmOptions {
   *    recursive?: boolean | undefined;
   *    force?: boolean | undefined;
   *    maxRetries?: number | undefined;
   *    retryDelay?: number | undefined;
   * };
   * ```
   * @param resource Arxiu o carpeta que s'eliminarà.
   * @param options.recursive If `true`, perform a recursive directory removal. In recursive mode, operations are retried on failure. default `true`.
   * @param options.force When `true`, exceptions will be ignored if `path` does not exist. default `true`.
   * @param options.maxRetries This option is ignored if the `recursive` option is not `true`. default `0`.
   * @param options.retryDelay The amount of time in milliseconds to wait between retries. This option is ignored if the `recursive` option is not `true`. default `100`.
   * @param options.verbose Indica si s'imprimirà informació del procés per la consola del terminal.
   */
  static removeSync(resource: string, options?: {
    recursive?: boolean | undefined;
    force?: boolean | undefined;
    maxRetries?: number | undefined;
    retryDelay?: number | undefined;
    verbose?: boolean;
  }) {
    if (!options) { options = {}; }
    const recursive = options.recursive === undefined ? true : options.recursive;
    const force = options.force === undefined ? true : options.force;
    const maxRetries = options.maxRetries === undefined ? 0 : options.maxRetries;
    const retryDelay = options.retryDelay === undefined ? 100 : options.retryDelay;
    const verbose = options.verbose === undefined ? false : options.verbose;
    if (verbose) { Terminal.log(`Eliminant ${Resource.isFile(resource) ? `l'arxiu` : `la carpeta`} ${chalk.green(resource)}.`); }
    if (Resource.exists(resource)) { fs.rmSync(resource, { recursive, force, maxRetries, retryDelay }); }
  }

  /** Renombra un arxiu o carpeta. */
  static rename(oldName: string, newName: string): Promise<boolean> {
    return new Promise<boolean>((resolve: any, reject: any) => {
      fs.rename(oldName, newName, (error) => {
        if (error) { reject(error); } else { resolve(true); }
      });
    });
  }


  /** Comprova si la carpeta conté arxius per copiar (que hagin superat el filtre). */
  static hasFilteredFiles(folder: string, filter?: FilterPatternType): boolean {
    if (!fs.lstatSync(folder).isDirectory()) { return false; }
    for (const file of fs.readdirSync(folder)) {
      const origin = path.join(folder, file);
      if (fs.lstatSync(origin).isFile()) {
        if (applyFilterPattern(origin, filter)) { return true; }
      } else {
        if (applyFilterPattern(origin, filter) && Resource.hasFilteredFiles(origin, filter)) { return true; }
      }
    }
    return false;
  }

}

