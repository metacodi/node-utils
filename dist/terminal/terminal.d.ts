/// <reference types="node" />
import { StdioOptions } from 'child_process';
import chalk from 'chalk';
export declare type CssExtendedColor = 'aliceblue' | 'antiquewhite' | 'aqua' | 'aquamarine' | 'azure' | 'beige' | 'bisque' | 'black' | 'blanchedalmond' | 'blue' | 'brown' | 'burlywood' | 'cadetblue' | 'coral' | 'cornflowerblue' | 'cornsilk' | 'darkblue' | 'darkcyan' | 'darkgoldenrod' | 'darkgrey' | 'darkkhaki' | 'darkmagenta' | 'darkorchid' | 'darkred' | 'darksalmon' | 'darkslategray' | 'darkslategrey' | 'darkturquoise' | 'deepskyblue' | 'dimgray' | 'dimgrey' | 'floralwhite' | 'forestgreen' | 'fuchsia' | 'gold' | 'goldenrod' | 'gray' | 'grey' | 'honeydew' | 'hotpink' | 'ivory' | 'khaki' | 'lavender' | 'lemonchiffon' | 'lightblue' | 'lightcoral' | 'lightgray' | 'lightgreen' | 'lightgrey' | 'lightseagreen' | 'lightskyblue' | 'lightslategray' | 'lightyellow' | 'lime' | 'limegreen' | 'maroon' | 'mediumaquamarine' | 'mediumblue' | 'mediumseagreen' | 'mediumslateblue' | 'mediumspringgreen' | 'midnightblue' | 'mintcream' | 'mistyrose' | 'navy' | 'oldlace' | 'olive' | 'orangered' | 'orchid' | 'palegoldenrod' | 'palevioletred' | 'papayawhip' | 'peachpuff' | 'plum' | 'powderblue' | 'purple' | 'royalblue' | 'saddlebrown' | 'salmon' | 'seashell' | 'sienna' | 'silver' | 'slategray' | 'slategrey' | 'snow' | 'tan' | 'teal' | 'thistle' | 'violet' | 'wheat' | 'white' | 'yellowgreen';
export declare type ChalkMethodColor = 'green' | 'black' | 'blue' | 'cyan' | 'gray' | 'green' | 'grey' | 'magenta' | 'red' | 'white' | 'yellow';
export declare type ChalkColor = ChalkMethodColor | CssExtendedColor;
export declare type TitleLine = 'both' | 'top' | 'bottom' | 'none';
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
export declare class Terminal {
    static verboseEnabled: boolean;
    static indent: number;
    static run(command: string, options?: TerminalRunOptions): Promise<any>;
    static log(message: string, ...data: any): void;
    static logInline(text: string): void;
    static verbose(message: string, data?: any): void;
    static blob(content: any): void;
    static warning(message: string): void;
    static error(error: any, exit?: boolean): void;
    static file(fileName: string, relativeTo?: string): string;
    static relative(from: string, to: string): number;
    static success(message: string, check?: string): void;
    static fail(error: string, check?: string): void;
    static clearLine(): void;
    static line(options?: ChalkOptions): void;
    static double(options?: ChalkOptions): void;
    static title(text: string, options?: ChalkOptions): void;
    static subtitle(text: string, options?: ChalkOptions): void;
    static renderChalk(content: any, options: ChalkOptions): any;
    static colorize(color: ChalkColor, value: any): string;
    static color(color?: ChalkColor): chalk.Chalk;
    static black(text: any): string;
    static blue(text: any): string;
    static cyan(text: any): string;
    static gray(text: any): string;
    static green(text: any): string;
    static grey(text: any): string;
    static magenta(text: any): string;
    static red(text: any): string;
    static white(text: any): string;
    static yellow(text: any): string;
    static aliceblue(text: any): string;
    static antiquewhite(text: any): string;
    static aqua(text: any): string;
    static aquamarine(text: any): string;
    static azure(text: any): string;
    static beige(text: any): string;
    static bisque(text: any): string;
    static blanchedalmond(text: any): string;
    static brown(text: any): string;
    static burlywood(text: any): string;
    static cadetblue(text: any): string;
    static coral(text: any): string;
    static cornflowerblue(text: any): string;
    static cornsilk(text: any): string;
    static darkblue(text: any): string;
    static darkcyan(text: any): string;
    static darkgoldenrod(text: any): string;
    static darkgrey(text: any): string;
    static darkkhaki(text: any): string;
    static darkmagenta(text: any): string;
    static darkorchid(text: any): string;
    static darkred(text: any): string;
    static darksalmon(text: any): string;
    static darkslategray(text: any): string;
    static darkslategrey(text: any): string;
    static darkturquoise(text: any): string;
    static deepskyblue(text: any): string;
    static dimgray(text: any): string;
    static dimgrey(text: any): string;
    static floralwhite(text: any): string;
    static forestgreen(text: any): string;
    static fuchsia(text: any): string;
    static gold(text: any): string;
    static goldenrod(text: any): string;
    static honeydew(text: any): string;
    static hotpink(text: any): string;
    static ivory(text: any): string;
    static khaki(text: any): string;
    static lavender(text: any): string;
    static lemonchiffon(text: any): string;
    static lightblue(text: any): string;
    static lightcoral(text: any): string;
    static lightgray(text: any): string;
    static lightgreen(text: any): string;
    static lightgrey(text: any): string;
    static lightseagreen(text: any): string;
    static lightskyblue(text: any): string;
    static lightslategray(text: any): string;
    static lightyellow(text: any): string;
    static lime(text: any): string;
    static limegreen(text: any): string;
    static maroon(text: any): string;
    static mediumaquamarine(text: any): string;
    static mediumblue(text: any): string;
    static mediumseagreen(text: any): string;
    static mediumslateblue(text: any): string;
    static mediumspringgreen(text: any): string;
    static midnightblue(text: any): string;
    static mintcream(text: any): string;
    static mistyrose(text: any): string;
    static navy(text: any): string;
    static oldlace(text: any): string;
    static olive(text: any): string;
    static orangered(text: any): string;
    static orchid(text: any): string;
    static palegoldenrod(text: any): string;
    static palevioletred(text: any): string;
    static papayawhip(text: any): string;
    static peachpuff(text: any): string;
    static plum(text: any): string;
    static powderblue(text: any): string;
    static purple(text: any): string;
    static royalblue(text: any): string;
    static saddlebrown(text: any): string;
    static salmon(text: any): string;
    static seashell(text: any): string;
    static sienna(text: any): string;
    static silver(text: any): string;
    static slategray(text: any): string;
    static slategrey(text: any): string;
    static snow(text: any): string;
    static tan(text: any): string;
    static teal(text: any): string;
    static thistle(text: any): string;
    static violet(text: any): string;
    static wheat(text: any): string;
    static yellowgreen(text: any): string;
}
//# sourceMappingURL=terminal.d.ts.map