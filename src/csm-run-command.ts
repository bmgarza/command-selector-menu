import { BaseArgumentsReturn, CatCom, ExecEnvOption, Platforms } from "./cat-com-structs";
import { ArgumentEnum, optionsReceived } from "./csm-console-arguments";
import { csmCommandColor, csmConsoleColor } from "./csm-console-colors";
import { colorConsole } from "./console-colors";
import { spawnCommand, spawnSyncCommand, executeCommand } from "./shell-command-promise-wrappers";
import { currentPlatform } from "./environment";

interface QEnvInterface {
    plat: Platforms,
    env: ExecEnvOption
}
const QuestionableEnvironments: Record<string, QEnvInterface> = {
    WinBash: {plat: Platforms.Windows, env: ExecEnvOption.Bash},
};

/**
 * This function goes through the process of running the command on the platform this is being run on.
 * @param command 
 */
export async function runCommand(command: CatCom): Promise<void> {
    console.log(`${csmConsoleColor}CSM: Running "${csmCommandColor}${command.name}${csmConsoleColor}"`);

    const baseCommandAndArguments: BaseArgumentsReturn = getCurrentPlatformBaseCommandAndArguments(currentPlatform, command);

    if (
        optionsReceived[ArgumentEnum.DISABLEVERIFY] === false &&
        command.execEnv !== undefined &&
        Object.values(QuestionableEnvironments).includes({plat: currentPlatform, env: command.execEnv}) &&
        (await confirmEnvExistance(currentPlatform, command.execEnv)) === false
    ) {
        throw new Error("The execEnv defined for the command selected doesn't look to exist.");
    }

    // NOTE: BG (May. 03, 2020) There is a way to specify in the exec command what shell to use, but I was
    //  unable to get this to work with powershell commands.
    if (command.async === true) {
        await Promise.all(
            // Take all the command strings and combine the resulting promises into a single one, to make sure they are
            //  all run simultaneously.
            (<string[]>command.subCatCom).map((cmdObj: string) => {
                colorConsole(`CSM: Executing "${cmdObj}"`, csmConsoleColor);
                return spawnCommand(baseCommandAndArguments.baseCommand, [...baseCommandAndArguments.baseCommandArguments, cmdObj]);
            })
        );
    }
    else {
        for(const cmdObj of <string[]>command.subCatCom) {
            colorConsole(`CSM: Executing "${cmdObj}"`, csmConsoleColor);
            spawnSyncCommand(baseCommandAndArguments.baseCommand, [...baseCommandAndArguments.baseCommandArguments, cmdObj]);
        }
    }
}

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

function getCurrentPlatformBaseCommandAndArguments(currentPlatform: Platforms, command: CatCom): BaseArgumentsReturn {
    let baseCommandReturn: BaseArgumentsReturn;
    switch(currentPlatform) {
        case Platforms.Windows:
            baseCommandReturn = getWindowsBaseArguments(command);
            break;

        case Platforms.Linux:
            baseCommandReturn = getLinuxBaseArguments(command);
            break;

        case Platforms.MacOS:
        default:
            throw new Error("This platform is not yet supported.");
            return;
    }

    return baseCommandReturn;
}

/**
 * 
 * @param command 
 */
function getWindowsBaseArguments(command: CatCom): BaseArgumentsReturn {
    let baseCommandArguments: string[];
    switch (command.execEnv) {
        case ExecEnvOption.WinPowershell:
            baseCommandArguments = ["-NoProfile", "-Command"];
            break;

        case ExecEnvOption.WinCommandPrompt:
        case undefined: // If there isn't an execEnv defined, default to the winCommandPrompt option
            baseCommandArguments = ["/c"];
            break;

        case ExecEnvOption.Bash:
            baseCommandArguments = ["--noprofile", "-c"];
            break;

        default:
            throw new Error("This Environment isn't supported on this platform.");
    }

    return {
        baseCommand: command.execEnv,
        baseCommandArguments: baseCommandArguments,
    };
}

/**
 * 
 * @param command 
 */
function getLinuxBaseArguments(command: CatCom): BaseArgumentsReturn {
    let baseCommandArguments: string[];
    switch (command.execEnv) {
        case ExecEnvOption.Bash:
        case undefined: // If there isn't an execEnv defined, default to the bash option
            baseCommandArguments = ["--noprofile", "-c"];
            break;

        default:
            throw new Error("This Environment isn't supported on this platform.");
    }

    return {
        baseCommand: command.execEnv,
        baseCommandArguments: baseCommandArguments,
    };
}
