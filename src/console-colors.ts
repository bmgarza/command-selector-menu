export const ConsoleTextMagenta: string = "\x1b[35m";
export const ConsoleTextBlack: string   = "\x1b[30m"
export const ConsoleTextRed: string     = "\x1b[31m"
export const ConsoleTextGreen: string   = "\x1b[32m"
export const ConsoleTextYellow: string  = "\x1b[33m"
export const ConsoleTextBlue: string    = "\x1b[34m"
export const ConsoleTextCyan: string    = "\x1b[36m"
export const ConsoleTextWhite: string   = "\x1b[37m"
export const ConsoleTextReset: string   = "\x1b[0m";

export function colorConsole(output: string, color: string): void {
    console.log(`${color}${output}${ConsoleTextReset}`);
}
