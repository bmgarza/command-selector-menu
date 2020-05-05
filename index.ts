import {
    platform as osPlatform,
} from "os";
import {
    exec as osExec,
    ExecException,
    spawn as spawnCmd,
    ChildProcessWithoutNullStreams,
} from "child_process";
import {
    existsSync as doesFileExist, readFileSync,
} from "fs";
import {
    extname as fileExtension,
} from "path";
import {
    createInterface,
    Interface as readlineInterface,
} from "readline";

enum ExecEnvOption {
    WinCommandPrompt = "cmd",
    WinPowershell = "powershell",
    Bash = "bash",
    Sh = "sh",
}

interface CatComJSON {
    platform: string;
    sorted: boolean;
    catComList: CatCom[];
}

interface CatCom {
    name: string;
    description: string;
    subCatCom: CatCom[] | string[];
    confirm?: boolean;
    execEnv?: string;
}

enum Platforms {
    Linux = "linux",
    MacOS = "darwin",
    Windows = "win32"
}

const ConsoleTextMagenta: string = "\x1b[35m";
const ConsoleTextBlack: string   = "\x1b[30m"
const ConsoleTextRed: string     = "\x1b[31m"
const ConsoleTextGreen: string   = "\x1b[32m"
const ConsoleTextYellow: string  = "\x1b[33m"
const ConsoleTextBlue: string    = "\x1b[34m"
const ConsoleTextCyan: string    = "\x1b[36m"
const ConsoleTextWhite: string   = "\x1b[37m"
const ConsoleTextReset: string   = "\x1b[0m";

function colorConsole(output: string, color: string): void {
    console.log(`${color}${output}${ConsoleTextReset}`);
}

// A promise wrapper for the exec command callback in order to be able to use the command with the async await notation
function executeCommand(commandString: string): Promise<string> {
    return new Promise((resolve: (value?: string | PromiseLike<string>) => void,
                        reject: (reason?: any) => void) => {
        osExec(
            commandString,
            (error: ExecException, stdout: string, stderr: string) => {
                if (error === null) {
                    resolve(stdout);
                } else {
                    reject(stderr);
                }
            },
        );
    });
}

// A promise wrapper for the spawn comman callback in order to be able to use the command with the async await notation
function spawnCommand(commandString: string, args?: string[], lineEndAdjust?: boolean): Promise<void> {
    return new Promise((resolve: (value?: void | PromiseLike<void>) => void, reject: (reason?: any) => void) => {
        let cmd: ChildProcessWithoutNullStreams = spawnCmd(
            commandString,
            args,
            {
                // Don't let the processes that are spawned be detached from the parent process
                detached: false,
                // Preserve stdio when running the command
                stdio: "inherit",
            }
        );

        cmd.on("close", (code: number) => {
            if(code === 0) {
                resolve();
            }
            else {
                let err: Error = new Error(`Command exited with code: ${code}`)
                reject(err);
            }
        });
    });
}

async function runCommand(command: CatCom): Promise<void> {
    colorConsole(`CSM: Running "${command.name}"`, ConsoleTextMagenta);
    switch(osPlatform()) {
        case Platforms.Windows:
            await runWindowsCommand(command);
            break;

        case Platforms.MacOS:
        case Platforms.Linux:
        default:
            console.log("This platform is not yet supported.");
            return;
    }
}

async function runWindowsCommand(command: CatCom): Promise<void> {
    if (command.execEnv === ExecEnvOption.WinPowershell) {
        // When running a command in powershell the powershell instance is started at its home directory, here we are
        //  getting the current location in order to use to cd into that directory whenever we run the command.
        const currentPath: string = await executeCommand("cd");

        // NOTE: BG (May. 03, 2020) There is a way to specify in the exec command what shell to use, but I was
        //  unable to get this to work with powershell commands.
        for(const cmdObj of <string[]>command.subCatCom) {
            colorConsole(`CSM: ${cmdObj}`, ConsoleTextMagenta);
            await spawnCommand(
                "powershell",
                ["-Command", `cd ${currentPath}; ${cmdObj}`],
            );
        }
    }
    else {
        for(const cmdObj of <string[]>command.subCatCom) {
            colorConsole(`CSM: ${cmdObj}`, ConsoleTextMagenta);
            await spawnCommand(
                "cmd",
                ["/c", cmdObj],
            );
        }
    }
}

function printCategory(index: number, name: string, description: string): void {
    console.log(`${index}) ${ConsoleTextYellow}${name}${ConsoleTextReset}: ${description}`);
}

function printCommand(index: number, name: string, description: string): void {
    console.log(`${index}) ${name}: ${description}`);
}

function isCategory(catComObj: CatCom): boolean {
    return (typeof catComObj.subCatCom[0]) !== "string";
}

function listCommands(catComObjList: CatCom[]): void {
    for(let i = 0; i < catComObjList.length; i++) {
        // If the first element in the subCatCom is a string, we know that it isn't a category.
        if(isCategory(catComObjList[i])) {
            printCategory(i, catComObjList[i].name, catComObjList[i].description);
        }
        else {
            printCommand(i, catComObjList[i].name, catComObjList[i].description);
        }
    }
}

// function verifyJSONFile(catComJSONObj: CatComJSON): boolean {
//     // TODO: BG (May. 04, 2020) Finish this function
//     return true;
// }

// function sortJSONFile(catComJSONObj: CatComJSON): void {
//     // TODO: BG (May. 04, 2020) Finish this function
// }

const rlInterface: readlineInterface = createInterface(
    {
        input: process.stdin,
        output: process.stdout,
    }
);

function getOptionNumber(): Promise<number> {
    return new Promise((resolve: (value?: number | PromiseLike<number>) => void, reject: (reason?: any) => void) => {
        rlInterface.question(
            "\nEnter option number: ",
            (answer: string) => {
                const parsedInt: number = parseInt(answer);
                if(!isNaN(parsedInt)) {
                    resolve(parsedInt);
                }
                else {
                    // This function doesn't reject because handling rejects in the async notation is disgusting.
                    resolve(-1);
                }
            }
        );
    });
}

function confirmCommand(name: string): Promise<boolean> {
    return new Promise((resolve: (value?: boolean | PromiseLike<boolean>) => void, reject: (reason?: any) => void) => {
        rlInterface.question(
            `\nAre you sure you want to run the (${ConsoleTextYellow}${name}${ConsoleTextReset}) command? `,
            (answer: string) => {
                if (answer.match(/^[Yy]+[Ee]*[Ss]*/g) !== null) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            }
        );
    });
}

interface CommandSelectionMenuReturn {
    startTime: number;
    optionSelectedList: number[];
}

async function commandSelectionMenu(filePath: string): Promise<CommandSelectionMenuReturn> {
    const parsedCommandJSON: CatComJSON = JSON.parse(readFileSync(filePath).toString("utf-8"));

    colorConsole(`File configuration path: ${filePath}`, ConsoleTextMagenta);
    console.log(`    ${ConsoleTextYellow}Category    ${ConsoleTextReset}Command`);

    let currentCatComList: CatCom[] = parsedCommandJSON.catComList;
    const optionSelectedList: number[] = [];
    while(true) {
        listCommands(currentCatComList);
        const optionSelected: number = await getOptionNumber();

        if (
            optionSelected >= 0 &&
            optionSelected < currentCatComList.length
        ) {
            // The option was within the acceptable bounds.
            if (isCategory(currentCatComList[optionSelected])) {
                optionSelectedList.push(optionSelected);
                // Because we know that the option selected was a category, casting the value assigned here is fine.
                currentCatComList = <CatCom[]>currentCatComList[optionSelected].subCatCom;
                continue;
            }
            else {
                if (currentCatComList[optionSelected].confirm === true) {
                    let response: boolean = await confirmCommand(currentCatComList[optionSelected].name);
                    if (response === false) {
                        colorConsole("Command selection canceled.", ConsoleTextRed);
                        continue;
                    }
                }
                optionSelectedList.push(optionSelected);
                const commandStartTime: number = Date.now();
                await runCommand(currentCatComList[optionSelected]);
                return {
                    startTime: commandStartTime,
                    optionSelectedList: optionSelectedList,
                }
            }
        }
        else {
            colorConsole("A valid parameter was not entered, please try again.", ConsoleTextRed);
            continue;
        }

        return;
    }
}

// TODO: BG (May. 04, 2020) Add the ability to pass through arguments which act as shortcuts for navigating through the
//  command JSON. i.e. if the user adds the arguments 2 12 4 it should navigate through the options that correspond to
//  those numbers in the JSON, if the option that was selected was a command run it, if the option that was selected was
//  a category start the selection process at the category.

const fileProvided: string = process.argv[2];

if(
    fileProvided !== undefined &&
    doesFileExist(fileProvided) &&
    fileExtension(fileProvided) === ".json"
) {
    // This file was provided a valid json file to get its information.
    commandSelectionMenu(fileProvided)
        .then((ret: CommandSelectionMenuReturn) => {
            colorConsole(`CSM: Command executed in ${Date.now() - ret.startTime}ms`, ConsoleTextMagenta);
            colorConsole(`CSM: Indexes Selected: ${ret.optionSelectedList.join(" ")}`, ConsoleTextMagenta);
            process.exit(0);
        })
        .catch((error: Error) => {
            throw error;
            process.exit(1);
        });
}
else {
    console.log("A valid json file was not provided");
}
