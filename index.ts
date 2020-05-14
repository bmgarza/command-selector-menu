import { platform as osPlatform } from "os";
import { existsSync as doesFileExist, readFileSync } from "fs";
import { extname as fileExtension, join as pathJoin } from "path";
import * as commandLineArguments from "command-line-args";
// This isn't strictly necessary, but it makes the types more legible
import { OptionDefinition, CommandLineOptions } from "command-line-args";

import {
    ArgumentEnum,
    CatCom,
    CatComJSON,
    CommandSelectionMenuReturn,
    ExecEnvOption,
    Platforms,
    MainReturn,
    ArgumentHelpMessage,
    ArgumentVersionMessage,
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

/**
 * TODO: BG (May. 06, 2020) After some forthought I've come to the conclusion that this command line application
 * shouldn't allow the user to input open-ended arguments. There are too many problems that come up when trying to get
 * something like that working:
 * * I feel that most of the instances where you would want to pass through a specific argument most of those instances
 *   would use a file's location as the argument that is passed through. The problem with this is that there is no
 *   reasonable way of including auto-complete functionality for the files that could be passed through to the
 *   function.
 * * I think that it would work to add this functionality for situations where you want to simply search for a file
 *   name in the current directory or any situations where you don't need to input a file path as an argument. But at
 *   the moment there aren't enough shortcuts that I want to implement that would use this functionality so...
 */

/**
 * TODO: BG (May. 13, 2020) I had a thoughts to potentially add the ability for the script to detect if there is a
 * csm.json file at the current directory and add that to the set of commands for the user to select from. However, I am
 * still unsure since this will add complexity when it comes to the index navigation, specifically that the index
 * navigation would fail sometimes if the user isn't in the correct directory and that doesn't sound right.
 */

const argumentOptions: OptionDefinition[] = [
    {
        name: ArgumentEnum.FILE,
        alias: "f",
        type: String,
        defaultValue: pathJoin(__dirname, "csm.json"),
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
    {
        name: ArgumentEnum.VERSION,
        alias: "v",
        type: Boolean,
    },
];
const optionsReceived: CommandLineOptions = commandLineArguments(
    argumentOptions,
);

if (optionsReceived[ArgumentEnum.HELP] === true) {
    console.log(ArgumentHelpMessage);
    process.exit(0);
}
else if (optionsReceived[ArgumentEnum.VERSION] === true) {
    console.log(ArgumentVersionMessage);
    process.exit(0);
}
else if(
    optionsReceived[ArgumentEnum.FILE] !== undefined &&
    doesFileExist(optionsReceived[ArgumentEnum.FILE]) &&
    fileExtension(optionsReceived[ArgumentEnum.FILE]) === ".json"
) {
    // The script was provided with a valid csm.json file
    let executionPromise: Promise<MainReturn>;
    if (optionsReceived[ArgumentEnum.INDEXNAV] !== undefined) {
        // The index navigation flag was given
        executionPromise = selectCommandFromIndexNavigation(optionsReceived[ArgumentEnum.FILE],
                                                            parseIndexNavigationString(optionsReceived[ArgumentEnum.INDEXNAV]));
    }
    else {
        executionPromise = openCommandSelectionJSON(optionsReceived[ArgumentEnum.FILE]);
    }

    executionPromise
        .then((ret: MainReturn) => {
            colorConsole(`CSM: Command executed in ${ConsoleTextReset}${Date.now() - ret.startTime}ms`, ConsoleTextMagenta);
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
    console.log("A valid json file was not provided");
    process.exit(2);
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

/**
 * Navigate through the csm.json that was provided given the index navigation string that was provided. If it
 * successfully finds a command it runs it, if it finds a category it presents the user with a user interface to
 * continue navigating through the category.
 * @param filePath The path to the csm.json you want to work with.
 * @param indexNav The parsed index navigation string provided by the user.
 */
async function selectCommandFromIndexNavigation(filePath: string, indexNav: number[]): Promise<MainReturn> {
    if (indexNav.length === 0) {
        throw new Error("Insufficient index navigation provided.");
    }

    const parsedCommandJSON: CatComJSON = JSON.parse(readFileSync(filePath).toString("utf-8"));

    colorConsole(`File configuration path: ${filePath}`, ConsoleTextMagenta);

    // Keep track of the CatCom list when navigating in case we don't find a command at the end of the index navigation.
    let currentCatComList: CatCom[] = parsedCommandJSON.catComList;
    let currentCatComSelected: CatCom;

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
        console.log(`${ConsoleTextMagenta}CSM category found: ${getCategoryPrint(currentCatComSelected)}`);
        return await commandSelectionMenuLoop(<CatCom[]>currentCatComSelected.subCatCom);
    } else {
        console.log(`${ConsoleTextMagenta}CSM command found: ${getCommandPrint(currentCatComSelected)}`);
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
    // Keep track of the CatCom list and the option selection history as we are traversing the csm.json
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

/**
 * Given a CatCom list, this function provides a command selection menu to the user until they select a CatCom option
 * that contains a command.
 * @param catComList 
 * @param optionsSelected 
 */
async function commandSelectionMenu(catComList: CatCom[], optionsSelected: number[] = []): Promise<CommandSelectionMenuReturn> {
    // If we are going to display a command selection menu to the user, we need to make sure that they are aware of what
    //  colors correspond to what.
    console.log(`${ConsoleTextYellow}Category color    ${ConsoleTextCyan}Command color${ConsoleTextReset}`);

    // Create new variables from what was provided in order to be able to modify them.
    let currentCatComList: CatCom[] = catComList;
    const optionSelectedList: number[] = optionsSelected;

    while (true) {
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
        }
    }

    const commandStartTime: number = Date.now();
    await runCommand(selectedCommand);

    return commandStartTime;
}

/**
 * Selects the CatCom at the index within the CatCom list that was provided. This probably doesn't need to be a
 * function, but here we are...
 * @param catComList 
 * @param indexSelected 
 */
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

/**
 * This function goes through the process of running the command on the platform this is being run on.
 * @param command 
 */
async function runCommand(command: CatCom): Promise<void> {
    console.log(`${ConsoleTextMagenta} CSM: Running "${ConsoleTextCyan}${command.name}${ConsoleTextMagenta}"`);

    switch(osPlatform()) {
        case Platforms.Windows:
            await runWindowsCommand(command);
            break;

        case Platforms.MacOS:
        case Platforms.Linux:
        default:
            throw new Error("This platform is not yet supported.");
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
                ["-NoProfile", "-Command", `${cmdObj}`],
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

function getCategoryPrint(category: CatCom, index?: number): string {
    if (index !== undefined) {
        return `${index}) ${ConsoleTextYellow}${category.name}${ConsoleTextReset}: ${category.description}`;
    } else {
        return `${ConsoleTextYellow}${category.name}${ConsoleTextReset}: ${category.description}`;
    }
}

function getCommandPrint(command: CatCom, index?: number): string {
    if (index !== undefined) {
        return `${index}) ${ConsoleTextCyan}${command.name}: ${ConsoleTextReset}${command.description}`;
    } else {
        return `${ConsoleTextCyan}${command.name}: ${ConsoleTextReset}${command.description}`;
    }
}

function isCategory(catComObj: CatCom): boolean {
    return (typeof catComObj.subCatCom[0]) !== "string";
}

function listCommands(catComObjList: CatCom[]): void {
    for(let i = 0; i < catComObjList.length; i++) {
        // If the first element in the subCatCom is a string, we know that it isn't a category.
        if(isCategory(catComObjList[i])) {
            console.log(getCategoryPrint(catComObjList[i], i));
        }
        else {
            console.log(getCommandPrint(catComObjList[i], i));
        }
    }
}
