import { CommandLineOptions } from "command-line-args";

import { CatComJSON, MainReturn, SelectionReturn } from "./cat-com-structs";
import { ArgumentEnum } from "./console-arguments";
import { selectCommandFromIndexNavigation, openCommandSelectionJSON } from "./command-selection";
import { runCommand } from "./run-command";

/**
 * This function exists as a way of getting the async await notation into the program.
 * @param catComJSON The parsed JSON file that was passed through to the program
 * @param optionsReceived The set of options that were received by the program
 */
export async function csmWrapper(catComJSON: CatComJSON, optionsReceived: CommandLineOptions): Promise<MainReturn> {
    let selectionReturn: SelectionReturn;
    if (optionsReceived[ArgumentEnum.INDEXNAV] !== undefined) {
        selectionReturn = await selectCommandFromIndexNavigation(catComJSON,
                                                                  parseIndexNavString(optionsReceived[ArgumentEnum.INDEXNAV]));
    }
    else {
        selectionReturn = await openCommandSelectionJSON(catComJSON);
    }

    const commandStartTime: number = Date.now();
    await runCommand(selectionReturn.catComSelected);

    return {
        startTime: commandStartTime,
        optionSelectedHistory: selectionReturn.optionSelectedHistory,
    }
}

//////////////////////////////////////////////////
// Application specific functions               //
//////////////////////////////////////////////////

function parseIndexNavString(input: string): number[] {
    const indexes: number[] = input.split(",").map((value: string) => parseInt(value, 10));
    if (indexes.every((value: number) => !isNaN(value))) {
        // Every index is a valid number
        return indexes;
    }
    else {
        return [];
    }
}
