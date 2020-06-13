import { existsSync as doesFileExist } from "fs";
import { extname as fileExtension } from "path";

import { MainReturn } from "./src/cat-com-structs";
import { ConsoleTextReset, colorConsole } from "./src/console-colors";
import { ArgumentEnum, ArgumentHelpMessage, ArgumentVersionMessage, optionsReceived } from "./src/csm-console-arguments";
import { csmConsoleColor, csmConErrorColor } from "./src/csm-console-colors";
import { selectCommandFromIndexNavigation, openCommandSelectionJSON } from "./src/csm-command-selection";

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

