import {
    platform as osPlatform,
} from "os";
import {
    existsSync as doesFileExist, readFileSync,
} from "fs";
import {
    extname as fileExtension,
} from "path";

import {
    CatCom,
    CatComJSON,
    CommandSelectionMenuReturn,
    ExecEnvOption,
    Platforms,
} from "./src/cat-com-structs";
import {
    ConsoleTextMagenta,
    ConsoleTextRed,
    ConsoleTextYellow,
    ConsoleTextReset,
    colorConsole,
} from "./src/console-colors";
import {
    executeCommand,
    spawnCommand,
} from "./src/shell-command-promise-wrappers";
import {
    confirmCommand,
    getOptionNumber,
} from "./src/user-interface"

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
    }
}

// TODO: BG (May. 04, 2020) Add the ability to pass through arguments which act as shortcuts for navigating through the
//  command JSON. i.e. if the user adds the arguments 2 12 4 it should navigate through the options that correspond to
//  those numbers in the JSON, if the option that was selected was a command run it, if the option that was selected was
//  a category start the selection process at the category. Make sure that this option is available through a flag and
//  not through regular means.

// TODO: BG (May. 06, 2020) Add the ability for any extra arguments, or any arguments after the -- characters, to be
//  passed through to the function that is being run. Alternatively allow the user to set an option that will prompt the
//  user for the arguments that are going to be used with the function that they have selected.

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
        })
        .finally(() => {
            process.exit(1);
        });
}
else {
    console.log("A valid json file was not provided");
}
