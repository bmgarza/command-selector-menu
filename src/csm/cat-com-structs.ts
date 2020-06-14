// NOTE: BMG (Jun. 07, 2020) The ExecEnvOptions that are listed should have their value match the name of the command
//  that is going to be called. i.e. the enumeration for bash should have the value of "bash" since that is how you
//  would initialize bash.
export enum ExecEnvOption {
    WinCommandPrompt = "cmd",
    WinPowershell = "powershell",
    Bash = "bash",
    Sh = "sh",
}

// NOTE: BMG (Jun. 14, 2020) If you're going to add a field to this interface, make sure you also update the
//  ./documentation/csm-json.md with the new field that was added. Additionally, if the field that was added was a
//  required field, make sure you add the corresponding verification into the verifyJSONFile function in the
//  ./src/csm/cat-com-json-utils.ts file.
export interface CatComJSON {
    catComList: CatCom[];
}

// NOTE: BMG (Jun. 14, 2020) If you're going to add a field to this interface, make sure you also update the
//  ./documentation/csm-json.md with the new field that was added. Additionally, if the field that was added was a
//  required field, make sure you add the corresponding verification into the verifyCatComList function in the
//  ./src/csm/cat-com-json-utils.ts file.
export interface CatCom {
    name: string;
    description: string;
    subCatCom: CatCom[] | string[];
    confirm?: boolean;
    async?: boolean;
    singleSession?: boolean;
    execEnv?: ExecEnvOption;
}

// NOTE: BMG (Jun. 07, 2020) An enumeration for this doesn't exist in the NodeJS typescript global.d.ts file
export enum Platforms {
    IBM_AIX = "aix",
    Android = "android",
    MacOS   = "darwin",
    FreeBSD = "freebsd",
    Linux   = "linux",
    OpenBSD = "openbsd",
    SunOS  = "sunos",
    Windows = "win32",
    Cygwin  = "cygwin",
    NetBSD  = "netbsd",
}

export enum ErrorRet {
    Success,
    ProcessFailed,
    InvalidConfiguration,
    InvalidJSONFormat,
}

export interface MainReturn {
    startTime: number;
    optionSelectedHistory: number[];
}

export interface SelectionReturn {
    catComSelected: CatCom;
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
    commandDivider: string;
}

export function isCategory(catComObj: CatCom): boolean {
    return (typeof catComObj.subCatCom[0]) !== "string";
}
