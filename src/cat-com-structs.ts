import {
    name as projectName,
    version as projectVersion,
    homepage,
} from "../package.json"

export enum ArgumentEnum {
    FILE = "file",
    INDEXNAV = "index-navigation",
    HELP = "help",
    VERSION = "version",
}

export const ArgumentHelpMessage: string = `
Usage: csm [options]
       csm --file ./csm.json

Options:
    -f --file               The location of the configuration file you'd like to use (If no value is provided the
                            default value will be ./csm.json relative to the location of the executable)
    -i --index-navigation   A comma separated list of numerical indexes to navigate to the desired command
    -h --help               Print the command-selector-menu help dialog (currently set)
    -v --version            Print the command-selector-menu version dialog

Documentation can be found at ${homepage}
`;

export const ArgumentVersionMessage: string = `${projectName} v${projectVersion}`;

export enum ExecEnvOption {
    WinCommandPrompt = "cmd",
    WinPowershell = "powershell",
    Bash = "bash",
    Sh = "sh",
}

export interface CatComJSON {
    platform: string;
    sorted: boolean;
    catComList: CatCom[];
}

export interface CatCom {
    name: string;
    description: string;
    subCatCom: CatCom[] | string[];
    confirm?: boolean;
    execEnv?: string;
}

export enum Platforms {
    Linux = "linux",
    MacOS = "darwin",
    Windows = "win32"
}

export interface MainReturn {
    startTime: number;
    optionSelectedHistory: number[];
}

export interface CommandSelectionMenuReturn {
    commandSelectedParentList: CatCom[];
    commandSelected: CatCom;
    indexSelected: number;
    optionSelectedHistory: number[];
}
