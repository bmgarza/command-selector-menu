import { readFileSync } from "fs";

import { CatCom, CatComJSON, CommandSelectionMenuReturn, MainReturn } from "./cat-com-structs";
import { csmCommandColor, csmConsoleColor, csmConErrorColor, csmCategoryColor } from "./csm-console-colors";
import { colorConsole } from "./console-colors";
import { isCategory } from "./cat-com-structs";
import { getCategoryPrint, getCommandPrint, listCommands } from "./csm-console-outputs";
import { confirmCommand, getOptionNumber } from "./csm-user-interface"
import { ConsoleTextReset } from "./console-colors";
import { ArgumentEnum, optionsReceived } from "./csm-console-arguments";
import { runCommand } from "./csm-run-command";

/**
 * Navigate through the csm.json that was provided given the index navigation string that was provided. If it
 * successfully finds a command it runs it, if it finds a category it presents the user with a user interface to
 * continue navigating through the category.
 * @param filePath The path to the csm.json you want to work with.
 * @param indexNav The parsed index navigation string provided by the user.
 */
export async function selectCommandFromIndexNavigation(filePath: string, indexNav: number[]): Promise<MainReturn> {
    if (indexNav.length === 0) {
        throw new Error("Insufficient index navigation provided.");
    }

    const parsedCommandJSON: CatComJSON = JSON.parse(readFileSync(filePath).toString("utf-8"));

    colorConsole(`File configuration path: ${filePath}`, csmConsoleColor);

    // Keep track of the CatCom list when navigating in case we don't find a command at the end of the index navigation.
    let currentCatComList: CatCom[] = parsedCommandJSON.catComList;
    let currentCatComSelected: CatCom;

    let i;
    for (i = 0; i < indexNav.length; i++) {
        try {
            currentCatComSelected = selectCatCom(currentCatComList, indexNav[i]);
            if (!isCategory(currentCatComSelected) && i !== (indexNav.length - 1)) {
                colorConsole("A command was prematurely reached, ignoring the rest of the indexes provided", csmConsoleColor);
                // Increase the index by one to make sure that the index used to reach this command is also included in the return.
                i++;
                break;
            } else {
                currentCatComList = <CatCom[]>currentCatComSelected.subCatCom;
            }
        }
        catch (error) {
            // One of the indexes that was provided caused the selectCatCom function to not successfully return a CatCom
            colorConsole(error.message, csmConErrorColor);
            throw new Error("The set of indexes provided don't properly point to an existing command option in the configuration.");
        }
    }

    if (isCategory(currentCatComSelected)) {
        console.log(`${csmConsoleColor}CSM category found: ${getCategoryPrint(currentCatComSelected)}`);
        return await commandSelectionMenuLoop(<CatCom[]>currentCatComSelected.subCatCom);
    } else {
        console.log(`${csmConsoleColor}CSM command found: ${getCommandPrint(currentCatComSelected)}`);
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
export async function openCommandSelectionJSON(filePath: string): Promise<MainReturn> {
    const parsedCommandJSON: CatComJSON = JSON.parse(readFileSync(filePath).toString("utf-8"));

    colorConsole(`File configuration path: ${filePath}`, csmConsoleColor);

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
                colorConsole(error.message, csmConErrorColor);
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
    console.log(`${csmCategoryColor}Category color    ${csmCommandColor}Command color${ConsoleTextReset}`);

    // Create new variables from what was provided in order to be able to modify them.
    let currentCatComList: CatCom[] = catComList;
    const optionSelectedList: number[] = optionsSelected;

    while (true) {
        listCommands(currentCatComList);
        let optionSelected: number = await getOptionNumber();
        if (optionsReceived[ArgumentEnum.ONEBASE]) {
            optionSelected--;
        }

        let catComSelected: CatCom;
        try {
            catComSelected = selectCatCom(currentCatComList, optionSelected);
        } catch (error) {
            colorConsole(error.message, csmConErrorColor);
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