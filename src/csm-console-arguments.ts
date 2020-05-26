import { join as pathJoin, dirname } from "path";
import * as commandLineArguments from "command-line-args";
// This isn't strictly necessary, but it makes the types more legible
import { OptionDefinition, CommandLineOptions } from "command-line-args";

import {
    name as projectName,
    version as projectVersion,
    homepage,
} from "../package.json"

export enum ArgumentEnum {
    FILE = "file",
    INDEXNAV = "index-navigation",
    COLOR = "color",
    ONEBASE = "one-based",
    HELP = "help",
    VERSION = "version",
}

export enum ConsoleColors {
    Default,
    Dim,
    Bright,
}

export const ArgumentHelpMessage: string = `
Usage: csm [options]
       csm --file ./csm.json

Options:
    -f --file               The location of the configuration file you'd like to use (If no value is provided the
                            default value will be ./csm.json relative to the location of the executable)
    -i --index-navigation   A comma separated list of numerical indexes to navigate to the desired command
    --color                 Sets the color displayed by the tool, it doesn't affect the color displayed by the commands
                            run (0 = Default, 1 = Dim, 2 = Bright)
    -o --one-based          Uses 1-based indexes for the selection menu instead of 0-based
    -h --help               Print the command-selector-menu help dialog (currently set)
    -v --version            Print the command-selector-menu version dialog

Documentation can be found at ${homepage}
`;

export const ArgumentVersionMessage: string = `${projectName} v${projectVersion}`;

const localDirectoryPath: string = dirname(process.execPath);

const argumentOptions: OptionDefinition[] = [
    {
        name: ArgumentEnum.FILE,
        alias: "f",
        type: String,
        defaultValue: pathJoin(localDirectoryPath, "csm.json"),
    },
    {
        name: ArgumentEnum.INDEXNAV,
        alias: "i",
        type: String,
    },
    {
        name: ArgumentEnum.COLOR,
        type: Number,
        defaultValue: 0,
    },
    {
        name: ArgumentEnum.ONEBASE,
        alias: "o",
        type: Boolean,
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
export const optionsReceived: CommandLineOptions = commandLineArguments(
    argumentOptions,
);
