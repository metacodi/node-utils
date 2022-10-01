import * as fs from 'fs';

import { Terminal, TerminalRunOptions } from '../terminal/terminal';


export class Git {

  constructor() {

  }

  /**
   * Comprova si hi ha canvis al repositori indicat o, s'hi no se n'indica cap, a l'actual.
   *
   * Si no s'indica cap filtre es cerquen tots els arxius que han canviat respecte del darrer commit (`'ACDMRTUXB'`).
   *
   * ```bash
   * git dif --diff-filter=[(A|C|D|M|R|T|U|X|B)...[*]]
   * ```
   * Select only files that are Added (A), Copied (C), Deleted (D), Modified (M), Renamed (R), have their type (i.e. regular
   * file, symlink, submodule, ...) changed (T), are Unmerged (U), are Unknown (X), or have had their pairing Broken (B). Any
   * combination of the filter characters (including none) can be used. When * (All-or-none) is added to the combination, all
   * paths are selected if there is any file that matches other criteria in the comparison; if there is no file that matches
   * other criteria, nothing is selected.
   */
  static async hasChanges(options?: { folder?: string, filter?: string, verbose?: boolean }): Promise<boolean> {
    if (!options) { options = {}; }
    const filter = options.filter === undefined ? 'ACDMRTUXB' : options.filter;
    const verbose = options.verbose === undefined ? false : options.verbose;
    const folder = options.folder === undefined ? '' : options.folder;
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      const cwd = process.cwd();
      const diffDir = !!folder && folder !== cwd;

      // Esstablim el directori del repositori.
      if (diffDir) { process.chdir(folder); }

      const head = (await Terminal.run(`git rev-parse --verify HEAD`, { verbose }) as string).trim();
      if (verbose) { console.log('head => ', head); }
      const changes = (await Terminal.run(`git diff --name-status --diff-filter=${filter} ${head}`, { verbose }) as string).trim();
      const lines = changes.split('\n');

      for (const l of lines) {
        if (l.length > 2 && filter.includes(l.charAt(0)) && l.charAt(1) === '\t') {
          resolve(true); return;
        }
      }

      // Restablim l'anterior carpeta de treball.
      if (diffDir) { process.chdir(cwd); }

      resolve(false);
    });
  }

  /**
   * Obté una llista dels arxius del repositori indicat o, s'hi no se n'indica cap, de l'actual.
   *
   * Si no s'indica cap filtre es cerquen tots els arxius que han canviat respecte del darrer commit (`'ACDMRTUXB'`).
   *
   * ```bash
   * git rev-parse --verify HEAD
   * ```
   * {@link https://git-scm.com/docs/git-rev-parse Pick out and massage parameters}
   *
   * Select only files that are Added (A), Copied (C), Deleted (D), Modified (M), Renamed (R), have their type (i.e. regular
   * file, symlink, submodule, ...) changed (T), are Unmerged (U), are Unknown (X), or have had their pairing Broken (B). Any
   * combination of the filter characters (including none) can be used. When * (All-or-none) is added to the combination, all
   * paths are selected if there is any file that matches other criteria in the comparison; if there is no file that matches
   * other criteria, nothing is selected.
   */
  static async getPendingChanges(options?: { folder?: string, filter?: string, verbose?: boolean }): Promise<{ filename: string, status: string }[]> {
    if (!options) { options = {}; }
    const filter = options.filter === undefined ? 'ACDMRTUXB' : options.filter;
    const verbose = options.verbose === undefined ? false : options.verbose;
    const folder = options.folder === undefined ? '' : options.folder;
    return new Promise<{ filename: string, status: string }[]>(async (resolve: any, reject: any) => {
      const cwd = process.cwd();
      const diffDir = !!folder && folder !== cwd;

      // Esstablim el directori del repositori.
      if (diffDir) { process.chdir(folder); }

      // Obtenim el hash dels canvis pendents.
      const head = (await Terminal.run(`git rev-parse --verify HEAD`, { verbose }) as string).trim();
      if (!!verbose) { console.log('head =>', head); }
      // Obtenim els canvis del commit obtingut.
      const results = await Git.getCommitChanges(head, { filter, verbose, folder });

      // Restablim l'anterior carpeta de treball.
      if (diffDir) { process.chdir(cwd); }

      resolve(results);
    });
  }

  /** Obté una llista amb tots els canvis de tots els commits des de la data indicada. */
  static async getChangesSince(date: string, options?: { folder?: string, filter?: string, verbose?: boolean }): Promise<{ filename: string, status: string }[]> {
    if (!options) { options = {}; }
    const filter = options.filter === undefined ? 'ACDMRTUXB' : options.filter;
    const verbose = options.verbose === undefined ? false : options.verbose;
    const folder = options.folder === undefined ? '' : options.folder;
    return new Promise<{ filename: string, status: string }[]>(async (resolve: any, reject: any) => {

      // Obtenim els canvis actuals.
      const results: any[] = await Git.getPendingChanges({ filter, verbose, folder });

      // Esstablim el directori del repositori.
      const cwd = process.cwd();
      const diffDir = !!folder && folder !== cwd;
      if (diffDir) { process.chdir(folder); }

      // Obtenim l'historial de commits fins a la data indicada.
      const log: string = await Terminal.run(`git log --since=${date.replace(' ', 'T')} --format=oneline`, { verbose });
      const commits = log.split('\n').filter(l => !!l);
      // NOTA: Evitem utilitzar map o reduce pq dins de la iteració s'ha de cridar a una funció asíncrona.
      for (const commit of commits) {
        const head = commit.split(' ')[0];
        const changes = await Git.getCommitChanges(head, { filter, verbose, folder });
        // NOTA: Com que els commits s'obtenen en ordre descendent (el més recent primer) obtindrem l'estat més recent de l'arxiu.
        results.push(...changes.filter(c => !results.find(r => r.filename === c.filename)));
      }

      // Restablim l'anterior carpeta de treball.
      if (diffDir) { process.chdir(cwd); }

      resolve(results.sort((a, b) => a.filename > b.filename ? 1 : -1));
    });
  }

  /**
   * Obté una llista dels arxius del repositori indicat o, s'hi no se n'indica cap, de l'actual.
   *
   * Si no s'indica cap filtre es cerquen tots els arxius del commit indicat (`'ACDMRTUXB'`).
   *
   * ```bash
   * git diff --diff-filter=[(A|C|D|M|R|T|U|X|B)...[*]]
   * ```
   * {@link https://git-scm.com/docs/git-diff Show changes between commits}
   *
   * Select only files that are Added (A), Copied (C), Deleted (D), Modified (M), Renamed (R), have their type (i.e. regular
   * file, symlink, submodule, ...) changed (T), are Unmerged (U), are Unknown (X), or have had their pairing Broken (B). Any
   * combination of the filter characters (including none) can be used. When * (All-or-none) is added to the combination, all
   * paths are selected if there is any file that matches other criteria in the comparison; if there is no file that matches
   * other criteria, nothing is selected.
   */
   static async getCommitChanges(head: string, options?: { folder?: string, filter?: string, verbose?: boolean }): Promise<{ filename: string, status: string }[]> {
    if (!options) { options = {}; }
    const filter = options.filter === undefined ? 'ACDMRTUXB' : options.filter;
    const verbose = options.verbose === undefined ? false : options.verbose;
    const folder = options.folder === undefined ? '' : options.folder;
    return new Promise<{ filename: string, status: string }[]>(async (resolve: any, reject: any) => {

      const changes = (await Terminal.run(`git diff --name-status --diff-filter=${filter} ${head}`, { verbose }) as string).trim();
      // if (!!verbose) { console.log('changes =>', changes); }
      const lines = changes.split('\n');

      const results: any[] = [];
      lines.map(line => {
        if (line.length > 2 && filter.includes(line.charAt(0)) && line.charAt(1) === '\t') {
          const parts = line.split('\t');
          results.push({
            filename: parts[1] as string,
            status: Git.codeToStatus(parts[0])
          });
        }
      });
      if (verbose) { console.log(results); }
      if (verbose) { console.log(''); }

      resolve(results);
    });
  }

  /**
   * Desfà els canvis en l'arxiu indicat.
   *
   * ```bash
   * git restore {{path/to/file}}
   * ```
   * {@link https://git-scm.com/docs/git-restore Git Restore}
   */
  static async discardChanges(resource?: string): Promise<any> {
    const isDirectory = fs.lstatSync(resource || '').isDirectory();
    if (isDirectory) {
      return Promise.reject(`No s'ha implementat l'opció de descartar canvis per una carpeta '${resource}'`);
    } else {
      return await Terminal.run(`git restore ${resource}`);
    }
  }

  /**
   * Publica el repositori indicat o, s'hi no se n'indica cap, el de la carpeta de treball l'actual `cwd`.
   *
   * ```bash
   * git add -A
   * git commit -m "auto-update"
   * git push origin master
   * ```
   */
  static async publish(options?: { folder?: string, commit?: string, branch?: string, run?: TerminalRunOptions }): Promise<boolean> {
    if (!options) { options = {}; }
    const commit = options.commit === undefined ? 'auto-commit' : options.commit;
    const branch = options.branch === undefined ? 'master' : options.branch;
    const run = options.run === undefined ? {} : options.run;
    const folder = options.folder === undefined ? '' : options.folder;

    // Esstablim el directori del repositori.
    const cwd = process.cwd();
    const diffDir = !!folder && folder !== cwd;
    if (diffDir) { process.chdir(folder); }

    let hasErrors = false;

    // Acceptem els canvis al reposiori.
    if (!hasErrors) { await Terminal.run(`git add -A`, run).catch((err: any) => { hasErrors = true; Terminal.log(`> git add -A`); Terminal.error(err); }); }
    // Fem el commit al reposiori.
    if (!hasErrors) { await Terminal.run(`git commit -m "${commit}"`, run).catch((err: any) => { hasErrors = true; Terminal.log(`> git commit -m "${commit}"`); Terminal.error(err); }); }
    // Publiquem el reposiori.
    if (!hasErrors) { await Terminal.run(`git push origin ${branch}`, run).catch((err: any) => { hasErrors = true; Terminal.log(`> git push origin ${branch}`); Terminal.error(err); }); }

    // Restablim l'anterior carpeta de treball.
    if (diffDir) { process.chdir(cwd); }

    return Promise.resolve(!hasErrors);
  }

  /**
   * Torna una descripció a partir del codi que defineix l'estat de canvis de l'arxiu.
   *
   * File status can be: Added (A), Copied (C), Deleted (D), Modified (M), Renamed (R), have their type (i.e. regular
   * file, symlink, submodule, ...) changed (T), are Unmerged (U), are Unknown (X), or have had their pairing Broken (B)
   */
  static codeToStatus(code: string): string | undefined {
    const map: { [key: string]: string } = {
      A: 'Added',
      C: 'Copied',
      D: 'Deleted',
      M: 'Modified',
      R: 'Renamed',
      T: 'Type-Change',
      U: 'Unmerged',
      X: 'Unknown',
      B: 'Broken'
    };
    return Object.keys(map).find(k => k === code);
  }

  foo() { return 'bar'; }

}
