import { optionsReceived, ArgumentEnum, ConsoleColors } from "./console-arguments"
import {
    ConsoleTextMagenta,
    ConsoleTextCyan,
    ConsoleTextYellow,
    ConsoleTextDim,
    ConsoleTextBright,
    ConsoleTextRed,
} from "../console-colors";

export let csmConsoleColor: string = "";
export let csmConErrorColor: string = "";
export let csmCommandColor: string = "";
export let csmCategoryColor: string = "";

switch (optionsReceived[ArgumentEnum.COLOR]) {
    case ConsoleColors.Default:
    default:
        csmConsoleColor = `${ConsoleTextMagenta}`;
        csmConErrorColor = `${ConsoleTextRed}`;
        csmCommandColor = `${ConsoleTextCyan}`;
        csmCategoryColor = `${ConsoleTextYellow}`;
        break;

    case ConsoleColors.Dim:
        csmConsoleColor = `${ConsoleTextDim}${ConsoleTextMagenta}`;
        csmConErrorColor = `${ConsoleTextDim}${ConsoleTextRed}`;
        csmCommandColor = `${ConsoleTextDim}${ConsoleTextCyan}`;
        csmCategoryColor = `${ConsoleTextDim}${ConsoleTextYellow}`;
        break;

    case ConsoleColors.Bright:
        csmConsoleColor = `${ConsoleTextBright}${ConsoleTextMagenta}`;
        csmConErrorColor = `${ConsoleTextBright}${ConsoleTextRed}`;
        csmCommandColor = `${ConsoleTextBright}${ConsoleTextCyan}`;
        csmCategoryColor = `${ConsoleTextBright}${ConsoleTextYellow}`;
        break;
}
