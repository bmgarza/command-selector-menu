export enum ExecEnvOption {
    WinCommandPrompt = "cmd",
    WinPowershell = "powershell",
    Bash = "bash",
    Sh = "sh",
}

export interface CatComJSON {
    catComList: CatCom[];
}

export interface CatCom {
    name: string;
    description: string;
    subCatCom: CatCom[] | string[];
    confirm?: boolean;
    async?: boolean;
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

export interface BaseArgumentsReturn {
    baseCommand: string;
    baseCommandArguments: string[];
}

export function isCategory(catComObj: CatCom): boolean {
    return (typeof catComObj.subCatCom[0]) !== "string";
}
