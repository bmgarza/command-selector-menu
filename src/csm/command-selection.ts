import { ConsoleTextReset, colorConsole } from "../console-colors";

import { CatCom, CatComJSON, CommandSelectionMenuReturn, SelectionReturn } from "./cat-com-structs";
import { csmCommandColor, csmConsoleColor, csmConErrorColor, csmCategoryColor } from "./csm-console-colors";
import { isCategory } from "./cat-com-structs";
import { getCategoryPrint, getCommandPrint, listCommands } from "./console-outputs";
import { confirmCommand, getOptionNumber } from "./user-interface"
import { ArgumentEnum, optionsReceived } from "./console-arguments";

/**
 * Navigate through the csm.json that was provided given the index navigation string that was provided. If it
 * successfully finds a command it runs it, if it finds a category it presents the user with a user interface to
 * continue navigating through the category.
 * @param filePath The path to the csm.json you want to work with.
 * @param indexNav The parsed index navigation string provided by the user.
 */
export async function selectCommandFromIndexNavigation(catComJSON: CatComJSON, indexNav: number[]): Promise<SelectionReturn> {
    if (indexNav.length === 0) {
        throw new Error("Insufficient index navigation provided.");
    }

    // Keep track of the CatCom list when navigating in case we don't find a command at the end of the index navigation.
    let currentCatComList: CatCom[] = catComJSON.catComList;
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
        return await commandSelectionMenuLoop(<CatCom[]>currentCatComSelected.subCatCom, indexNav.slice(0, i));
    } else {
        console.log(`${csmConsoleColor}CSM command found: ${getCommandPrint(currentCatComSelected)}`);

        if (currentCatComSelected.confirm === true) {
            const response: boolean = await confirmCommand(currentCatComSelected.name);
            if (response === false) {
                return await commandSelectionMenuLoop(<CatCom[]>currentCatComSelected.subCatCom, indexNav.slice(0, i));
            }
        }

        return {
            // startTime: await runCommandSelected(currentCatComSelected),
            catComSelected: currentCatComSelected,
            // We slice based on the last index that we ran in order to 
            optionSelectedHistory: indexNav.slice(0, i),
        }
    }
}

/**
 * Opens the command selection menu directly from the root of the configuration file that was given.
 * @param filePath 
 */
export async function openCommandSelectionJSON(catComJSON: CatComJSON): Promise<SelectionReturn> {
    return await commandSelectionMenuLoop(catComJSON.catComList);
}

/**
 * This function contains the logic to run the command selection menu in a loop until the user confirms a command that
 * they want to run. Basically this function's reason for existing is to ensure that the process doesn't suddenly stop
 * when the user declines the confirmation of a given command.
 * @param catComList 
 */
async function commandSelectionMenuLoop (catComList: CatCom[], existingOpHistory: number[] = []): Promise<SelectionReturn> {
    // Keep track of the CatCom list and the option selection history as we are traversing the csm.json
    let currentCatComList: CatCom[] = catComList;
    let currentOptionSelectedHistory: number[] = existingOpHistory;

    // A while loop to allow the user to select another command if they decline the confirmation for the command that
    //  they did select
    while (true) {
        const selectionReturn: CommandSelectionMenuReturn = await commandSelectionMenu(currentCatComList, currentOptionSelectedHistory);
        // Assign the current CatCom list to be the parent list that was return from the selection menu to allow the user 
        currentCatComList = selectionReturn.commandSelectedParentList;
        currentOptionSelectedHistory = selectionReturn.optionSelectedHistory;

        if (selectionReturn.commandSelected.confirm === true) {
            const response: boolean = await confirmCommand(selectionReturn.commandSelected.name);
            if (response === false) {
                continue;
            }
        }

        return {
            catComSelected: selectionReturn.commandSelected,
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
        let optionSelected: number;
        let catComSelected: CatCom;
        try {
            optionSelected = await getOptionNumber();

            if (optionsReceived[ArgumentEnum.ONEBASE]) {
                optionSelected--;
            }

            catComSelected = selectCatCom(currentCatComList, optionSelected);
        }
        catch (error) {
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
        throw new Error(`The given index was outside the range of the list: ${indexSelected}`);
    }

}
