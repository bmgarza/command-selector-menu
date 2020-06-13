import { colorConsole } from "../console-colors";
import { currentPlatform } from "../environment";
import { spawnCommand, spawnSyncCommand, executeCommand } from "../shell-command-promise-wrappers";

import { BaseArgumentsReturn, CatCom, ExecEnvOption, Platforms } from "./cat-com-structs";
import { ArgumentEnum, optionsReceived } from "./console-arguments";
import { csmCommandColor, csmConsoleColor } from "./csm-console-colors";

interface QEnvInterface {
    plat: Platforms,
    env: ExecEnvOption
}
const QuestionableEnvironments: Record<string, QEnvInterface> = {
    WinBash: {plat: Platforms.Windows, env: ExecEnvOption.Bash},
};

/**
 * This function goes through the process of running the command on the platform this is being run on.
 * @param command The CatCom command that the user has selected.
 */
export async function runCommand(command: CatCom): Promise<void> {
    console.log(`${csmConsoleColor}CSM: Running "${csmCommandColor}${command.name}${csmConsoleColor}"`);

    const baseCommandAndArguments: BaseArgumentsReturn = getCurrentPlatformBaseCommandAndArguments(currentPlatform, command);

    if (
        optionsReceived[ArgumentEnum.DISABLEVERIFY] !== true &&
        command.execEnv !== undefined &&
        // Convert the record into an array and try to find the index where the parameters match
        Object.values(QuestionableEnvironments).findIndex((val: QEnvInterface) => val.plat === currentPlatform && val.env === command.execEnv) >= 0 &&
        (await confirmEnvExistance(currentPlatform, command.execEnv)) === false
    ) {
        throw new Error(`The execution environment defined for the command selected (${command.execEnv}) doesn't appear to exist.`);
    }

    // NOTE: BG (May. 03, 2020) There is a way to specify in the exec command what shell to use, but I was
    //  unable to get this to work with powershell commands.
    if (command.async === true) {
        // Take all the command strings and combine the resulting promises into a single one, to make sure they are
        //  all run simultaneously.
        await Promise.all(
            (<string[]>command.subCatCom).map((cmdObj: string) => {
                colorConsole(`CSM: Executing "${cmdObj}"`, csmConsoleColor);
                return spawnCommand(baseCommandAndArguments.baseCommand, [...baseCommandAndArguments.baseCommandArguments, cmdObj]);
            })
        );
    }
    else {
        if (command.singleSession !== true) {
            for(const cmdObj of <string[]>command.subCatCom) {
                colorConsole(`CSM: Executing "${cmdObj}"`, csmConsoleColor);
                // We're using the spawnSync command instead of the spawn command in order to ensure that commands that
                //  take user input work with stdin properly
                spawnSyncCommand(baseCommandAndArguments.baseCommand, [...baseCommandAndArguments.baseCommandArguments, cmdObj]);
            }
        }
        else {
            // Run all the commands in a single execution environment session, allowing for environment variables to
            //  carry over between commands.
            for(const cmdObj of <string[]>command.subCatCom) {
                colorConsole(`CSM: Executing "${cmdObj}"`, csmConsoleColor);
            }
            // We're using the spawnSync command instead of the spawn command in order to ensure that commands that take
            //  user input work with stdin properly
            spawnSyncCommand(
                baseCommandAndArguments.baseCommand,
                [
                    ...baseCommandAndArguments.baseCommandArguments,
                    (<string[]>command.subCatCom).join(baseCommandAndArguments.commandDivider)
                ]
            );
        }
    }
}

/**
 * Determine if the execution environment exists on a given platform.
 * @param platform The current platform.
 * @param environment The environment in question.
 */
async function confirmEnvExistance(platform: Platforms, environment: ExecEnvOption): Promise<boolean> {
    switch (platform) {
        case Platforms.Windows:
            try {
                await executeCommand(`where ${environment}`);
            }
            catch (error) {
                break;
            }
            return true;

        case Platforms.Linux:
            // NOTE: BMG (Jun. 08, 2020) I'm not 100% sure if this is the best way of detecting whether the execution
            //  environment exists in the current platform or not.
            // NOTE: BMG (Jun. 08, 2020) This method probably works for any system that includes the util-linux package
            //  or the whereis command.
            const whereisRet: string = await executeCommand(`whereis -b ${environment}`);
            if (whereisRet.split(" ").length > 1) {
                return true;
            }
            break;

        default:
            throw new Error(`Unable to confirm the existence of the execution environment. There is an entry in the ` +
                            `QuestionableEnvironment Array that matches the current platform (${platform}) and ` +
                            `environment (${environment}), but doesn't currently have a case in the ` +
                            `confirmEnvExistance function to handle the platform in question.`);
    }

    return false;
}

/**
 * Pretty self explanatory, gets the base arguments that are going to be used based on the current platform.
 * @param currentPlatform The current platform.
 * @param command The CatCom command that the user has selected.
 */
function getCurrentPlatformBaseCommandAndArguments(currentPlatform: Platforms, command: CatCom): BaseArgumentsReturn {
    let baseCommandReturn: BaseArgumentsReturn;
    switch(currentPlatform) {
        case Platforms.Windows:
            baseCommandReturn = getWindowsBaseArguments(command);
            break;

        case Platforms.Linux:
            baseCommandReturn = getLinuxBaseArguments(command);
            break;

        default:
            throw new Error("This platform is not yet supported.");
    }

    return baseCommandReturn;
}

/**
 * Generate the base arguments for Windows systems based on the specifics of the command that the user has selected.
 * @param command The CatCom command that the user has selected.
 */
function getWindowsBaseArguments(command: CatCom): BaseArgumentsReturn {
    let baseCommand: string = command.execEnv;
    let baseCommandArguments: string[];
    let commandDivider: string = ";"; // This is the most common divider used
    switch (command.execEnv) {
        case ExecEnvOption.WinPowershell:
            baseCommandArguments = ["-NoProfile", "-Command"];
            break;

        case undefined: // If there isn't an execEnv defined, default to the winCommandPrompt option
            baseCommand = ExecEnvOption.WinCommandPrompt;
        case ExecEnvOption.WinCommandPrompt:
            baseCommandArguments = ["/c"];
            commandDivider = "&&"; // Command prompt doesn't like semi-colons
            break;

        case ExecEnvOption.Bash:
            baseCommandArguments = ["--noprofile", "-c"];
            break;

        default:
            throw new Error("This Environment isn't supported on this platform.");
    }

    return {
        baseCommand: baseCommand,
        baseCommandArguments: baseCommandArguments,
        commandDivider: commandDivider,
    };
}

/**
 * Generate the base arguments for Linux systems based on the specifics of the command that the user has selected.
 *
 * NOTE: BMG (Jun. 11, 2020) I am aware that it is not a given that the bash environment exists within a Linux
 * environment, but it is the most prevalent command line so it is what we are using as the default for the time being.
 * If it makes sense later I might adapt it to use the confirmEnvExistance function to dynamically choose the
 * environment if it is not defined, it would add execution time but it might be worth it for some users.
 * @param command The CatCom command that the user has selected.
 */
function getLinuxBaseArguments(command: CatCom): BaseArgumentsReturn {
    let baseCommand: string = command.execEnv;
    let baseCommandArguments: string[];
    let commandDivider: string = ";"; // This is the most common divider used
    switch (command.execEnv) {
        case undefined: // If there isn't an execEnv defined, default to the bash option
            baseCommand = ExecEnvOption.Bash;
        case ExecEnvOption.Bash:
            baseCommandArguments = ["--noprofile", "-c"];
            break;

        default:
            throw new Error("This Environment isn't supported on this platform.");
    }

    return {
        baseCommand: baseCommand,
        baseCommandArguments: baseCommandArguments,
        commandDivider: commandDivider,
    };
}
