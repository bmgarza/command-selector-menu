export const ConsoleTextReset: string = "\x1b[0m";
export const ConsoleTextBright: string = "\x1b[1m";
export const ConsoleTextDim: string = "\x1b[2m";
export const ConsoleTextUnderscore: string = "\x1b[4m";
export const ConsoleTextBlink: string = "\x1b[5m";
export const ConsoleTextReverse: string = "\x1b[7m";
export const ConsoleTextHidden: string = "\x1b[8m";

export const ConsoleTextBlack: string   = "\x1b[30m";
export const ConsoleTextRed: string     = "\x1b[31m";
export const ConsoleTextGreen: string   = "\x1b[32m";
export const ConsoleTextYellow: string  = "\x1b[33m";
export const ConsoleTextBlue: string    = "\x1b[34m";
export const ConsoleTextMagenta: string = "\x1b[35m";
export const ConsoleTextCyan: string    = "\x1b[36m";
export const ConsoleTextWhite: string   = "\x1b[37m";

export function colorConsole(output: string, color: string): void {
    console.log(`${color}${output}${ConsoleTextReset}`);
}
