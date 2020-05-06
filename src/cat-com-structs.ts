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

export interface CommandSelectionMenuReturn {
    startTime: number;
    optionSelectedList: number[];
}