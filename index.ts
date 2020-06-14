import { existsSync as doesFileExist, readFileSync } from "fs";
import { extname as fileExtension } from "path";

import { ConsoleTextReset, colorConsole } from "./src/console-colors";

import { MainReturn, CatComJSON, ErrorRet } from "./src/csm/cat-com-structs";
import { ArgumentEnum, ArgumentHelpMessage, ArgumentVersionMessage, optionsReceived } from "./src/csm/console-arguments";
import { csmConsoleColor, csmConErrorColor } from "./src/csm/csm-console-colors";
import { verifyJSONFile } from "./src/csm/cat-com-json-utils";
import { production } from "./src/environment";
import { csmWrapper } from "./src/csm/async-await-wrapper";

if (!production) {
    console.log("The process is in DEBUGGING mode.");
}

if (optionsReceived[ArgumentEnum.HELP] === true) {
    console.log(ArgumentHelpMessage);
    process.exit(ErrorRet.Success);
}
else if (optionsReceived[ArgumentEnum.VERSION] === true) {
    console.log(ArgumentVersionMessage);
    process.exit(ErrorRet.Success);
}
else if(
    optionsReceived[ArgumentEnum.FILE] !== undefined &&
    doesFileExist(optionsReceived[ArgumentEnum.FILE]) &&
    fileExtension(optionsReceived[ArgumentEnum.FILE]) === ".json"
) {
    const parsedCommandJSON: CatComJSON = JSON.parse(readFileSync(optionsReceived[ArgumentEnum.FILE]).toString("utf-8"));
    if (!verifyJSONFile(parsedCommandJSON)) {
        console.log("The configuration file provided does not contain the necessary fields to be valid.");
        process.exit(ErrorRet.InvalidJSONFormat);
    }
    colorConsole(`File configuration path: ${optionsReceived[ArgumentEnum.FILE]}`, csmConsoleColor);

    csmWrapper(parsedCommandJSON, optionsReceived)
        .then((ret: MainReturn) => {
            colorConsole(`CSM: Command executed in ${ConsoleTextReset}${Date.now() - ret.startTime}ms`, csmConsoleColor);
            colorConsole(
                `CSM: Navigation shortcut flag: ${ConsoleTextReset}-i ${ret.optionSelectedHistory.join(",")}`,
                csmConsoleColor
            );
            process.exit(ErrorRet.Success);
        })
        .catch((error: Error) => {
            colorConsole(error.message, csmConErrorColor);
            throw error;
        })
        .finally(() => {
            process.exit(ErrorRet.ProcessFailed);
        });
}
else {
    console.log("An invalid configuration file was provided.");
    process.exit(ErrorRet.InvalidConfiguration);
}
