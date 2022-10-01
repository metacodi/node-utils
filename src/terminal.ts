import { StdioOptions, exec, spawn, ExecException } from 'child_process';
import chalk from 'chalk';


export type CssExtendedColor = 'aliceblue' | 'antiquewhite' | 'aqua' | 'aquamarine'
  | 'azure' | 'beige' | 'bisque' | 'black' | 'blanchedalmond' | 'blue' | 'brown'
  | 'burlywood' | 'cadetblue' | 'coral' | 'cornflowerblue' | 'cornsilk' | 'darkblue'
  | 'darkcyan' | 'darkgoldenrod' | 'darkgrey' | 'darkkhaki' | 'darkmagenta'
  | 'darkorchid' | 'darkred' | 'darksalmon' | 'darkslategray' | 'darkslategrey'
  | 'darkturquoise' | 'deepskyblue' | 'dimgray' | 'dimgrey' | 'floralwhite'
  | 'forestgreen' | 'fuchsia' | 'gold' | 'goldenrod' | 'gray' | 'grey' | 'honeydew'
  | 'hotpink' | 'ivory' | 'khaki' | 'lavender' | 'lemonchiffon' | 'lightblue'
  | 'lightcoral' | 'lightgray' | 'lightgreen' | 'lightgrey' | 'lightseagreen'
  | 'lightskyblue' | 'lightslategray' | 'lightyellow' | 'lime' | 'limegreen'
  | 'maroon' | 'mediumaquamarine' | 'mediumblue' | 'mediumseagreen'
  | 'mediumslateblue' | 'mediumspringgreen' | 'midnightblue' | 'mintcream'
  | 'mistyrose' | 'navy' | 'oldlace' | 'olive' | 'orangered' | 'orchid'
  | 'palegoldenrod' | 'palevioletred' | 'papayawhip' | 'peachpuff' | 'plum'
  | 'powderblue' | 'purple' | 'royalblue' | 'saddlebrown' | 'salmon' | 'seashell'
  | 'sienna' | 'silver' | 'slategray' | 'slategrey' | 'snow' | 'tan' | 'teal'
  | 'thistle' | 'violet' | 'wheat' | 'white' | 'yellowgreen'
;
export type ChalkMethodColor = 'green' | 'black' | 'blue' | 'cyan' | 'gray' | 'green'
  | 'grey' | 'magenta' | 'red' | 'white' | 'yellow'
;
export type ChalkColor = ChalkMethodColor | CssExtendedColor;

export type TitleLine = 'both' | 'top' | 'bottom' | 'none';

export interface ChalkOptions {
  color?: ChalkColor;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  lines?: TitleLine;
}

export interface TerminalRunOptions {
  verbose?: boolean;
  stdio?: StdioOptions;
  titleColor?: ChalkColor;
}

export class Terminal {

  /** Quan s'estableix a `false` les funcions `verbose` i `blob` no escriuen res per consola. */
  static verboseEnabled = false;
  static indent = 0;


  // --------------------------------------------------------------------------------
  //  run
  // --------------------------------------------------------------------------------

  /** @category Execution */
  static async run(command: string, options?: TerminalRunOptions): Promise<any> {
    if (!options) { options = {}; }
    const verbose = options.verbose === undefined ? Terminal.verboseEnabled : !!options.verbose;
    const stdio = options.stdio || (verbose ? 'pipe' : 'inherit');
    const color = options.titleColor;
    return new Promise<any>((resolve: any, reject: any) => {

      if (verbose) {

        Terminal.renderChalk(command, { color, bold: true });
        const parts = command.split(' ');
        const args = parts.slice(1);
        const proc = spawn(parts[0], args, { stdio, shell: true });

        // Quan la sortida standard (stdio) està en 'inherit', el resultat surt directament per consola.
        // Quan la sortida està en 'pipe', els handlers (stdout, stderr) s'activen i des d'allà escribim inmediatament el resultat per no fer esperar l'usuari a que s'acibi el procés.
        let stdout = ''; if (proc.stdout) { proc.stdout.on('data', (data: any) => { stdout += data.toString(); process.stdout.write(chalk.green(data.toString())); }); }
        let stderr = ''; if (proc.stderr) { proc.stderr.on('data', (data: any) => { stderr += data.toString(); process.stdout.write(chalk.yellow(data.toString())); }); }
        proc.once('exit', (code: number, signal: NodeJS.Signals) => {
          // Només sortim amb error si hi ha un codi d'error i a més tb un missatge escrit quan el pipe està derivat.
          if (!!code && (stdio === 'inherit' || !!stderr)) { reject(stderr); } else { resolve(stdout); }
        });

      } else {

        exec(command, (error: ExecException, stdout: string, stderr: string) => {
          // Nomnés sortim amb error quan hi ha un codi d'error i un texte d'error.
          if (!!error && !!error.code && !!stderr) {
            reject(stderr);
          } else {
            resolve(stdout);
          }
        });
      }
    });
  }


  // --------------------------------------------------------------------------------
  //  Log & Error
  // --------------------------------------------------------------------------------

  /** @category Log */
  static log(message: string, ...data: any): void {
    const indent = '  '.repeat(Terminal.indent);
    Terminal.clearLine();
    if (data === undefined) {
      console.log(indent + message);
    } else {
      console.log(indent + message, ...data);
    }
  }

  /**
   * Escriu a la consola sobrescrivint la línia actual.
   *
   * Al final del texte no s'hi afegeix cap retorn de línea.
   *
   * S'utilitza quan es vol evitar l'scroll a la consola i
   * anar mostrant només el pas actual d'un procés, com per exemple
   * els passos secondaris d'una instal·lació, o d'una llarga còpia d'arxius.
   * @category Log
   */
   static logInline(text: string) {
    Terminal.clearLine();
    process.stdout.write(`${text}`);
  }

  /** @category Log */
  static verbose(message: string, data?: any): void {
    if (Terminal.verboseEnabled) {
      Terminal.clearLine();
      Terminal.log(message, data);
    }
  }

  /** @category Log */
  static blob(content: any): void {
    if (Terminal.verboseEnabled) {
      Terminal.clearLine();
      Terminal.line();
      Terminal.log(content);
      Terminal.line();
    }
  }

  /** @category Log */
  static warning(message: string): void {
    Terminal.clearLine();
    Terminal.log(chalk.bold.yellow('WARN: ') + chalk.yellow(message) + '\n');
  }

  /** @category Log */
  static error(error: any, exit = true): void {
    Terminal.clearLine();
    const message = typeof error === 'string' ? error : error.error || error.message || 'Error desconegut';
    Terminal.log(chalk.bold.red('ERROR: ') + chalk.red(message));
    if (exit) { Terminal.line(); process.exit(1); }
  }

  /** @category Log */
  static file(fileName: string, relativeTo?: string): string {
    const i = relativeTo ? Terminal.relative(fileName, relativeTo) : fileName.split('\\').join('/').lastIndexOf('/');
    if (i > 0) {
      const base = fileName.substring(0, i);
      const name = fileName.substring(i);
      return chalk.green(base) + chalk.bold.green(name);

    } else {
      return chalk.green(fileName);
    }
  }

  /** @category Log */
  static relative(from: string, to: string): number {
    let i = 0;
    while (i < Math.min(from.length, to.length)) {
      if (from.charAt(i) !== to.charAt(i)) { return i - 1; }
      i++;
    }
    return i - 1;
  }


  // --------------------------------------------------------------------------------
  //  Test result
  // --------------------------------------------------------------------------------

  /**
   * Escriu un text amb un check verd davant.
   * @category Test result
   */
  static success(message: string, check = '√'): void {
    Terminal.clearLine();
    Terminal.log(`${chalk.bold.green(check)} ${message}`);
  }

  /**
   * Escriu un text amb una creu vermella davant.
   * @category Test result
   */
  static fail(error: string, check = 'x'): void {
    Terminal.clearLine();
    Terminal.log(`${chalk.bold.red(check)} ${error}`);
  }

  static clearLine() {
    // Neteja la línia actual.
    process.stdout.clearLine(0);
    // Coloca el cursor a la primera posició de la línia.
    process.stdout.cursorTo(0);
  }


  // --------------------------------------------------------------------------------
  //  Sections
  // --------------------------------------------------------------------------------

  /** @category Sections */
  static line(options?: ChalkOptions): void {
    if (!options) { options = {}; }
    if (options.bold === undefined) { options.bold = false; }
    const color = options.color;
    const line = `--------------------------------------------------------------------------------`;
    Terminal.log(Terminal.colorize(color, options.bold ? chalk.bold(line) : line));
  }

  /** @category Sections */
  static double(options?: ChalkOptions): void {
    if (!options) { options = {}; }
    if (options.bold === undefined) { options.bold = false; }
    const color = options.color;
    const line = `================================================================================`;
    Terminal.log(Terminal.colorize(color, options.bold ? chalk.bold(line) : line));
  }
  /** @category Sections */
  static title(text: string, options?: ChalkOptions): void {
    if (!options) { options = {}; }
    if (options.bold === undefined) { options.bold = true; }
    const lines = options.lines = options.lines === undefined ? 'both' : options.lines;
    const newLine = lines === 'top' || lines === 'both' ? '' : '\n';

    Terminal.renderChalk(newLine + text, options);
  }

  /** @category Sections */
  static subtitle(text: string, options?: ChalkOptions): void {
    if (!options) { options = {}; }
    if (options.bold === undefined) { options.bold = true; }
    const lines = options.lines = options.lines === undefined ? 'bottom' : options.lines;
    const newLine = lines === 'top' || lines === 'both' ? '' : '\n';

    Terminal.renderChalk(newLine + text, options);
  }

  // --------------------------------------------------------------------------------
  //  renderChalk
  // --------------------------------------------------------------------------------

  /** @category Chalk */
  static renderChalk(content: any, options: ChalkOptions): any {
    if (!options) { options = {}; }
    if (options.bold === undefined) { options.bold = false; }

    const color = options.color;
    const lines = options.lines === undefined ? 'both' : options.lines;

    content = options.bold ? chalk.bold(content) : content;
    content = options.italic ? chalk.italic(content) : content;
    content = options.underline ? chalk.underline(content) : content;
    content = options.strikethrough ? chalk.strikethrough(content) : content;
    content = options.color ? Terminal.colorize(options.color, content) : content;

    if (lines === 'top' || lines === 'both') { Terminal.line({ color }); } // else { Terminal.log(''); }
    Terminal.log(content);
    if (lines === 'bottom' || lines === 'both') { Terminal.line({ color }); }
  }

  /** @category Color */
  static colorize(color: ChalkColor, value: any): string {
    const colorizer = Terminal.color(color);
    if (colorizer) {
      return colorizer(value);
    } else {
      return value;
    }
  }

  /** @category Color */
  static color(color?: ChalkColor): chalk.Chalk {
    switch (color) {
      case 'black': return chalk.black;
      case 'blue': return chalk.blue;
      case 'cyan': return chalk.cyan;
      case 'gray': return chalk.gray;
      case 'green': return chalk.green;
      case 'grey': return chalk.grey;
      case 'magenta': return chalk.magenta;
      case 'red': return chalk.red;
      case 'white': return chalk.white;
      case 'yellow': return chalk.yellow;
      default:
        if (color) {
          return chalk.keyword(color);
        } else {
          return undefined;
        }
    }
  }


  // --------------------------------------------------------------------------------
  //  Chalk method colors
  // --------------------------------------------------------------------------------

  /** @category Color */ static black(text: any): string { return chalk.black(text); }
  /** @category Color */ static blue(text: any): string { return chalk.blue(text); }
  /** @category Color */ static cyan(text: any): string { return chalk.cyan(text); }
  /** @category Color */ static gray(text: any): string { return chalk.gray(text); }
  /** @category Color */ static green(text: any): string { return chalk.green(text); }
  /** @category Color */ static grey(text: any): string { return chalk.grey(text); }
  /** @category Color */ static magenta(text: any): string { return chalk.magenta(text); }
  /** @category Color */ static red(text: any): string { return chalk.red(text); }
  /** @category Color */ static white(text: any): string { return chalk.white(text); }
  /** @category Color */ static yellow(text: any): string { return chalk.yellow(text); }


  // --------------------------------------------------------------------------------
  //  Css extended colors
  // --------------------------------------------------------------------------------

  /** @category Color */ static aliceblue(text: any): string { return Terminal.colorize('aliceblue', text); }
  /** @category Color */ static antiquewhite(text: any): string { return Terminal.colorize('antiquewhite', text); }
  /** @category Color */ static aqua(text: any): string { return Terminal.colorize('aqua', text); }
  /** @category Color */ static aquamarine(text: any): string { return Terminal.colorize('aquamarine', text); }
  /** @category Color */ static azure(text: any): string { return Terminal.colorize('azure', text); }
  /** @category Color */ static beige(text: any): string { return Terminal.colorize('beige', text); }
  /** @category Color */ static bisque(text: any): string { return Terminal.colorize('bisque', text); }
  /** @category Color */ static blanchedalmond(text: any): string { return Terminal.colorize('blanchedalmond', text); }
  /** @category Color */ static brown(text: any): string { return Terminal.colorize('brown', text); }
  /** @category Color */ static burlywood(text: any): string { return Terminal.colorize('burlywood', text); }
  /** @category Color */ static cadetblue(text: any): string { return Terminal.colorize('cadetblue', text); }
  /** @category Color */ static coral(text: any): string { return Terminal.colorize('coral', text); }
  /** @category Color */ static cornflowerblue(text: any): string { return Terminal.colorize('cornflowerblue', text); }
  /** @category Color */ static cornsilk(text: any): string { return Terminal.colorize('cornsilk', text); }
  /** @category Color */ static darkblue(text: any): string { return Terminal.colorize('darkblue', text); }
  /** @category Color */ static darkcyan(text: any): string { return Terminal.colorize('darkcyan', text); }
  /** @category Color */ static darkgoldenrod(text: any): string { return Terminal.colorize('darkgoldenrod', text); }
  /** @category Color */ static darkgrey(text: any): string { return Terminal.colorize('darkgrey', text); }
  /** @category Color */ static darkkhaki(text: any): string { return Terminal.colorize('darkkhaki', text); }
  /** @category Color */ static darkmagenta(text: any): string { return Terminal.colorize('darkmagenta', text); }
  /** @category Color */ static darkorchid(text: any): string { return Terminal.colorize('darkorchid', text); }
  /** @category Color */ static darkred(text: any): string { return Terminal.colorize('darkred', text); }
  /** @category Color */ static darksalmon(text: any): string { return Terminal.colorize('darksalmon', text); }
  /** @category Color */ static darkslategray(text: any): string { return Terminal.colorize('darkslategray', text); }
  /** @category Color */ static darkslategrey(text: any): string { return Terminal.colorize('darkslategrey', text); }
  /** @category Color */ static darkturquoise(text: any): string { return Terminal.colorize('darkturquoise', text); }
  /** @category Color */ static deepskyblue(text: any): string { return Terminal.colorize('deepskyblue', text); }
  /** @category Color */ static dimgray(text: any): string { return Terminal.colorize('dimgray', text); }
  /** @category Color */ static dimgrey(text: any): string { return Terminal.colorize('dimgrey', text); }
  /** @category Color */ static floralwhite(text: any): string { return Terminal.colorize('floralwhite', text); }
  /** @category Color */ static forestgreen(text: any): string { return Terminal.colorize('forestgreen', text); }
  /** @category Color */ static fuchsia(text: any): string { return Terminal.colorize('fuchsia', text); }
  /** @category Color */ static gold(text: any): string { return Terminal.colorize('gold', text); }
  /** @category Color */ static goldenrod(text: any): string { return Terminal.colorize('goldenrod', text); }
  /** @category Color */ static honeydew(text: any): string { return Terminal.colorize('honeydew', text); }
  /** @category Color */ static hotpink(text: any): string { return Terminal.colorize('hotpink', text); }
  /** @category Color */ static ivory(text: any): string { return Terminal.colorize('ivory', text); }
  /** @category Color */ static khaki(text: any): string { return Terminal.colorize('khaki', text); }
  /** @category Color */ static lavender(text: any): string { return Terminal.colorize('lavender', text); }
  /** @category Color */ static lemonchiffon(text: any): string { return Terminal.colorize('lemonchiffon', text); }
  /** @category Color */ static lightblue(text: any): string { return Terminal.colorize('lightblue', text); }
  /** @category Color */ static lightcoral(text: any): string { return Terminal.colorize('lightcoral', text); }
  /** @category Color */ static lightgray(text: any): string { return Terminal.colorize('lightgray', text); }
  /** @category Color */ static lightgreen(text: any): string { return Terminal.colorize('lightgreen', text); }
  /** @category Color */ static lightgrey(text: any): string { return Terminal.colorize('lightgrey', text); }
  /** @category Color */ static lightseagreen(text: any): string { return Terminal.colorize('lightseagreen', text); }
  /** @category Color */ static lightskyblue(text: any): string { return Terminal.colorize('lightskyblue', text); }
  /** @category Color */ static lightslategray(text: any): string { return Terminal.colorize('lightslategray', text); }
  /** @category Color */ static lightyellow(text: any): string { return Terminal.colorize('lightyellow', text); }
  /** @category Color */ static lime(text: any): string { return Terminal.colorize('lime', text); }
  /** @category Color */ static limegreen(text: any): string { return Terminal.colorize('limegreen', text); }
  /** @category Color */ static maroon(text: any): string { return Terminal.colorize('maroon', text); }
  /** @category Color */ static mediumaquamarine(text: any): string { return Terminal.colorize('mediumaquamarine', text); }
  /** @category Color */ static mediumblue(text: any): string { return Terminal.colorize('mediumblue', text); }
  /** @category Color */ static mediumseagreen(text: any): string { return Terminal.colorize('mediumseagreen', text); }
  /** @category Color */ static mediumslateblue(text: any): string { return Terminal.colorize('mediumslateblue', text); }
  /** @category Color */ static mediumspringgreen(text: any): string { return Terminal.colorize('mediumspringgreen', text); }
  /** @category Color */ static midnightblue(text: any): string { return Terminal.colorize('midnightblue', text); }
  /** @category Color */ static mintcream(text: any): string { return Terminal.colorize('mintcream', text); }
  /** @category Color */ static mistyrose(text: any): string { return Terminal.colorize('mistyrose', text); }
  /** @category Color */ static navy(text: any): string { return Terminal.colorize('navy', text); }
  /** @category Color */ static oldlace(text: any): string { return Terminal.colorize('oldlace', text); }
  /** @category Color */ static olive(text: any): string { return Terminal.colorize('olive', text); }
  /** @category Color */ static orangered(text: any): string { return Terminal.colorize('orangered', text); }
  /** @category Color */ static orchid(text: any): string { return Terminal.colorize('orchid', text); }
  /** @category Color */ static palegoldenrod(text: any): string { return Terminal.colorize('palegoldenrod', text); }
  /** @category Color */ static palevioletred(text: any): string { return Terminal.colorize('palevioletred', text); }
  /** @category Color */ static papayawhip(text: any): string { return Terminal.colorize('papayawhip', text); }
  /** @category Color */ static peachpuff(text: any): string { return Terminal.colorize('peachpuff', text); }
  /** @category Color */ static plum(text: any): string { return Terminal.colorize('plum', text); }
  /** @category Color */ static powderblue(text: any): string { return Terminal.colorize('powderblue', text); }
  /** @category Color */ static purple(text: any): string { return Terminal.colorize('purple', text); }
  /** @category Color */ static royalblue(text: any): string { return Terminal.colorize('royalblue', text); }
  /** @category Color */ static saddlebrown(text: any): string { return Terminal.colorize('saddlebrown', text); }
  /** @category Color */ static salmon(text: any): string { return Terminal.colorize('salmon', text); }
  /** @category Color */ static seashell(text: any): string { return Terminal.colorize('seashell', text); }
  /** @category Color */ static sienna(text: any): string { return Terminal.colorize('sienna', text); }
  /** @category Color */ static silver(text: any): string { return Terminal.colorize('silver', text); }
  /** @category Color */ static slategray(text: any): string { return Terminal.colorize('slategray', text); }
  /** @category Color */ static slategrey(text: any): string { return Terminal.colorize('slategrey', text); }
  /** @category Color */ static snow(text: any): string { return Terminal.colorize('snow', text); }
  /** @category Color */ static tan(text: any): string { return Terminal.colorize('tan', text); }
  /** @category Color */ static teal(text: any): string { return Terminal.colorize('teal', text); }
  /** @category Color */ static thistle(text: any): string { return Terminal.colorize('thistle', text); }
  /** @category Color */ static violet(text: any): string { return Terminal.colorize('violet', text); }
  /** @category Color */ static wheat(text: any): string { return Terminal.colorize('wheat', text); }
  /** @category Color */ static yellowgreen(text: any): string { return Terminal.colorize('yellowgreen', text); }


}

