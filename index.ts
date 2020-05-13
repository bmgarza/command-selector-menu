import { platform as osPlatform } from "os";
import { existsSync as doesFileExist, readFileSync } from "fs";
import { extname as fileExtension } from "path";
import * as commandLineArguments from "command-line-args";
// This isn't strictly necessary, but it makes the types more legible
import { OptionDefinition, CommandLineOptions } from "command-line-args";

import {
    CatCom,
    CatComJSON,
    CommandSelectionMenuReturn,
    ExecEnvOption,
    Platforms,
    MainReturn,
} from "./src/cat-com-structs";
import {
    ConsoleTextMagenta,
    ConsoleTextRed,
    ConsoleTextYellow,
    ConsoleTextReset,
    colorConsole,
    ConsoleTextCyan,
} from "./src/console-colors";
import { executeCommand, spawnCommand } from "./src/shell-command-promise-wrappers";
import { confirmCommand, getOptionNumber } from "./src/user-interface"

// TODO: BG (May. 04, 2020) Add the ability to pass through arguments which act as shortcuts for navigating through the
//  command JSON. i.e. if the user adds the arguments 2 12 4 it should navigate through the options that correspond to
//  those numbers in the JSON, if the option that was selected was a command run it, if the option that was selected was
//  a category start the selection process at the category. Make sure that this option is available through a flag and
//  not through regular means.

// TODO: BG (May. 06, 2020) After some forthought I've come to the conclusion that this command line application
//  shouldn't allow the user to input open-ended arguments. There are too many problems that come up when trying to get
//  something like that working:
//  * I feel that most of the instances where you would want to pass through a specific argument most of those instances
//    would use a file's location as the argument that is passed through. The problem with this is that there is no
//    reasonable way of including auto-complete functionality for the files that could be passed through to the
//    function.
//  * I think that it would work to add this functionality for situations where you want to simply search for a file
//    name in the current directory or any situations where you don't need to input a file path as an argument. But at
//    the moment there aren't enough shortcuts that I want to implement that would use this functionality so...

enum ArgumentEnum {
    FILE = "file",
    INDEXNAV = "indexNavigation",
    HELP = "help",
}

const argumentOptions: OptionDefinition[] = [
    {
        name: ArgumentEnum.FILE,
        alias: "f",
        type: String,
    },
    {
        name: ArgumentEnum.INDEXNAV,
        alias: "i",
        type: String,
    },
    {
        name: ArgumentEnum.HELP,
        alias: "h",
        type: Boolean,
    },
];
const optionsReceived: CommandLineOptions = commandLineArguments(
    argumentOptions,
);

if(
    optionsReceived[ArgumentEnum.FILE] !== undefined &&
    doesFileExist(optionsReceived[ArgumentEnum.FILE]) &&
    fileExtension(optionsReceived[ArgumentEnum.FILE]) === ".json"
) {
    if (optionsReceived[ArgumentEnum.INDEXNAV] !== undefined) {
        // If there was an indexNavigation argument passed through
        selectCommandFromIndexNavigation(
            optionsReceived[ArgumentEnum.FILE],
            parseIndexNavigationString(optionsReceived[ArgumentEnum.INDEXNAV]),
           ).then((ret: MainReturn) => {
                colorConsole(`CSM: Command executed in ${Date.now() - ret.startTime}ms`, ConsoleTextMagenta);
                colorConsole(
                    `CSM: Navigation shortcut flag: ${ConsoleTextReset}-i ${ret.optionSelectedHistory.join(",")}`,
                    ConsoleTextMagenta
                );
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
        // This file was provided a valid json file to get its information.
        openCommandSelectionJSON(optionsReceived[ArgumentEnum.FILE])
            .then((ret: MainReturn) => {
                colorConsole(`CSM: Command executed in ${Date.now() - ret.startTime}ms`, ConsoleTextMagenta);
                colorConsole(
                    `CSM: Navigation shortcut flag: ${ConsoleTextReset}-i ${ret.optionSelectedHistory.join(",")}`,
                    ConsoleTextMagenta
                );
                process.exit(0);
            })
            .catch((error: Error) => {
                throw error;
            })
            .finally(() => {
                process.exit(1);
            });
    }
}
else {
    console.log("A valid json file was not provided");
}

//////////////////////////////////////////////////
// Application specific functions               //
//////////////////////////////////////////////////

function parseIndexNavigationString(input: string): number[] {
    const indexes: number[] = input.split(",").map((value: string) => parseInt(value, 10));
    if (indexes.every((value: number) => !isNaN(value))) {
        // Every index is a valid number
        return indexes;
    }
    else {
        return [];
    }
}

// TODO: BG (May. 12, 2020) Finish the rewrite you were working on. Eventually you want there to be only one exit point
//  that both the index navigation and the manu selection go to.
async function selectCommandFromIndexNavigation(filePath: string, indexNav: number[]): Promise<MainReturn> {
    if (indexNav.length === 0) {
        throw new Error("Insufficient index navigation provided.");
    }

    const parsedCommandJSON: CatComJSON = JSON.parse(readFileSync(filePath).toString("utf-8"));

    colorConsole(`File configuration path: ${filePath}`, ConsoleTextMagenta);

    let currentCatComList: CatCom[] = parsedCommandJSON.catComList;
    let currentCatComSelected: CatCom;
    // TODO: BG (May. 07, 2020) Finish this portion of the function. It will go through the list of indexes that were
    //  provided and then, if the final object is a category it will let the user continue the selection process, if the
    //  final object is a command it will run the command. If the function finds an index that doesn't have a
    //  corresponding index value in the command JSON file provided, it will default back to the commandSelectionMenu
    //  function as a return. Everything should be happy if this is done.
    let i;
    for (i = 0; i < indexNav.length; i++) {
        try {
            currentCatComSelected = selectCatCom(currentCatComList, indexNav[i]);
            if (!isCategory(currentCatComSelected) && i !== (indexNav.length - 1)) {
                colorConsole("A command was prematurely reached, ignoring the rest of the indexes provided", ConsoleTextYellow);
                // Increase the index by one to make sure that the index used to reach this command is also included in the return.
                i++;
                break;
            } else {
                currentCatComList = <CatCom[]>currentCatComSelected.subCatCom;
            }
        }
        catch (error) {
            // One of the indexes that was provided caused the selectCatCom function to not successfully return a CatCom
            colorConsole(error.message, ConsoleTextRed);
            throw new Error("The set of indexes provided don't properly point to an existing command option in the configuration.");
        }
    }

    if (isCategory(currentCatComSelected)) {
        return await commandSelectionMenuLoop(<CatCom[]>currentCatComSelected.subCatCom);
    } else {
        console.log(`${ConsoleTextMagenta}CSM command found: ${ConsoleTextCyan}${currentCatComSelected.name}: ${ConsoleTextReset}${currentCatComSelected.description}`);
        return {
            startTime: await runCommandSelected(currentCatComSelected),
            // We slice based on the last index that we ran in order to 
            optionSelectedHistory: indexNav.slice(0, i),
        }
    }
}

/**
 * Opens the command selection menu directly from the root of the configuration file that was given.
 * @param filePath 
 */
async function openCommandSelectionJSON(filePath: string): Promise<MainReturn> {
    const parsedCommandJSON: CatComJSON = JSON.parse(readFileSync(filePath).toString("utf-8"));

    colorConsole(`File configuration path: ${filePath}`, ConsoleTextMagenta);

    return await commandSelectionMenuLoop(parsedCommandJSON.catComList);
}

/**
 * This function contains the logic to run the command selection menu in a loop until the user confirms a command that
 * they want to run. Basically this function's reason for existing is to ensure that the process doesn't suddenly stop
 * when the user declines the confirmation of a given command.
 * @param catComList 
 */
async function commandSelectionMenuLoop (catComList: CatCom[]): Promise<MainReturn> {
    let currentCatComList: CatCom[] = catComList;
    let currentOptionSelectedHistory: number[] = [];
    while (true) {
        const selectionReturn: CommandSelectionMenuReturn = await commandSelectionMenu(currentCatComList, currentOptionSelectedHistory);
        // Assign the current CatCom list to be the parent list that was return from the selection menu to allow the user 
        currentCatComList = selectionReturn.commandSelectedParentList;
        currentOptionSelectedHistory = selectionReturn.optionSelectedHistory;

        let commandStartTime: number;
        try {
            commandStartTime = await runCommandSelected(selectionReturn.commandSelected);
        } catch (error) {
            const errorMessageString: string = <string>error.message;
            if (errorMessageString.includes("selection")) {
                // If the string contains the "selection" it is most likely that the error that was received was because
                //  the user cancelled the command selection confirmation. This ensures that the loop is restarted to
                //  allow the user to select the correct command, if it was contained within the selection that was made.
                colorConsole(error.message, ConsoleTextRed);
                continue;
            } else {
                throw error;
            }
        }

        return {
            startTime: commandStartTime,
            optionSelectedHistory: [
                ...currentOptionSelectedHistory,
                selectionReturn.indexSelected,
            ],
        }
    }
}

// Given a CatCom list, this function provides a command selection menu to the user until they select a CatCom option
//  that contains a command.
async function commandSelectionMenu(catComList: CatCom[], optionsSelected: number[] = []): Promise<CommandSelectionMenuReturn> {
    // If we are going to display a command selection menu to the user, we need to make sure that they are aware of what
    //  colors correspond to what.
    console.log(`${ConsoleTextYellow}Category color    ${ConsoleTextCyan}Command color${ConsoleTextReset}`);

    // Create new variables from what was provided in order to be able to modify them.
    let currentCatComList: CatCom[] = catComList;
    const optionSelectedList: number[] = optionsSelected;

    while (true) {
        // TODO: BG (May. 07, 2020) Abstrat this portion of the function into its own function since it will be used in
        //  both the selectCommandFromIndex and the commandSelectionMenu functions.
        listCommands(currentCatComList);
        const optionSelected: number = await getOptionNumber();

        let catComSelected: CatCom;
        try {
            catComSelected = selectCatCom(currentCatComList, optionSelected);
        } catch (error) {
            colorConsole(error.message, ConsoleTextRed);
            continue;
        }

        // The option was within the acceptable bounds.
        if (isCategory(catComSelected)) {
            optionSelectedList.push(optionSelected);
            // Because we know that the option selected was a category, casting the value assigned here is fine.
            currentCatComList = <CatCom[]>catComSelected.subCatCom;
            continue;
        }
        else {
            return {
                commandSelectedParentList: currentCatComList,
                commandSelected: catComSelected,
                indexSelected: optionSelected,
                optionSelectedHistory: optionSelectedList,
            }
        }
    }
}

/**
 * This command does the following:
 * 1. Prompts the user for confirmation to run the selected command, if the corresponding boolean has been set in the configuration used.
 *     a. If the user decides to decline the configuration, an error is returned indicating that the selected has been canceled.
 * 2. Once the selection has been confirmed, the time that the command was selected is recorded and the command begins to run.
 * @param selectedCommand The command that has been selected.
 * @returns The number of milliseconds that correspond to the Date.now() value.
 */
async function runCommandSelected(selectedCommand: CatCom): Promise<number> {
    if (selectedCommand.confirm === true) {
        let response: boolean = await confirmCommand(selectedCommand.name);
        if (response === false) {
            throw new Error("Command selection canceled.");
            // colorConsole("Command selection canceled.", ConsoleTextRed);
            // continue;
        }
    }

    const commandStartTime: number = Date.now();
    await runCommand(selectedCommand);

    return commandStartTime;
}

function selectCatCom(catComList: CatCom[], indexSelected: number): CatCom {
    if (
        indexSelected >= 0 &&
        indexSelected < catComList.length
    ) {
        return catComList[indexSelected];
    }
    else {
        throw new Error(`A valid index for the given list wasn't given: ${indexSelected}`);
    }

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
            colorConsole(`CSM: Executing "${cmdObj}"`, ConsoleTextMagenta);
            await spawnCommand(
                "powershell",
                ["-Command", `cd ${currentPath}; ${cmdObj}`],
            );
        }
    }
    else {
        for(const cmdObj of <string[]>command.subCatCom) {
            colorConsole(`CSM: Executing "${cmdObj}"`, ConsoleTextMagenta);
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
    console.log(`${index}) ${ConsoleTextCyan}${name}: ${ConsoleTextReset}${description}`);
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
