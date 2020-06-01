import { existsSync as doesFileExist } from "fs";
import { extname as fileExtension } from "path";

import { MainReturn } from "./src/cat-com-structs";
import { ConsoleTextReset, colorConsole } from "./src/console-colors";
import { ArgumentEnum, ArgumentHelpMessage, ArgumentVersionMessage, optionsReceived } from "./src/csm-console-arguments";
import { csmConsoleColor, csmConErrorColor } from "./src/csm-console-colors";
import { selectCommandFromIndexNavigation, openCommandSelectionJSON } from "./src/csm-command-selection";

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

/**
 * TODO: BMG (May. 27, 2020)
 * Create an aws account for yourself to distribute pre-made versions of the binary.
 *
 * Expand documentation to give examples of how to make the json that will be provided to the program.
 *
 * maybe: Add support for pulling/pushing the csm.json using git gists.
 */

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
            colorConsole(`CSM: Command executed in ${ConsoleTextReset}${Date.now() - ret.startTime}ms`, csmConsoleColor);
            colorConsole(
                `CSM: Navigation shortcut flag: ${ConsoleTextReset}-i ${ret.optionSelectedHistory.join(",")}`,
                csmConsoleColor
            );
            process.exit(0);
        })
        .catch((error: Error) => {
            colorConsole(error.message, csmConErrorColor);
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

