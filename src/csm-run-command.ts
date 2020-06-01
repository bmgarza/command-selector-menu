import { BaseArgumentsReturn, CatCom, ExecEnvOption, Platforms } from "./cat-com-structs";
import { csmCommandColor, csmConsoleColor } from "./csm-console-colors";
import { colorConsole } from "./console-colors";
import { spawnCommand, spawnSyncCommand } from "./shell-command-promise-wrappers";

/**
 * This function goes through the process of running the command on the platform this is being run on.
 * @param command 
 */
export async function runCommand(command: CatCom): Promise<void> {
    console.log(`${csmConsoleColor}CSM: Running "${csmCommandColor}${command.name}${csmConsoleColor}"`);

    let baseCommandReturn: BaseArgumentsReturn;
    switch(process.platform) {
        case Platforms.Windows:
            // await runWindowsCommand(command);
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

    // NOTE: BG (May. 03, 2020) There is a way to specify in the exec command what shell to use, but I was
    //  unable to get this to work with powershell commands.
    if (command.async === true) {
        await Promise.all(
            // Take all the command strings and turn them into powershell command promises
            (<string[]>command.subCatCom).map((cmdObj: string) => {
                colorConsole(`CSM: Executing "${cmdObj}"`, csmConsoleColor);
                return spawnCommand(baseCommandReturn.baseCommand, [...baseCommandReturn.baseCommandArguments, cmdObj]);
            })
        );
    }
    else {
        for(const cmdObj of <string[]>command.subCatCom) {
            colorConsole(`CSM: Executing "${cmdObj}"`, csmConsoleColor);
            spawnSyncCommand(baseCommandReturn.baseCommand, [...baseCommandReturn.baseCommandArguments, cmdObj]);
        }
    }
}

/**
 * 
 * @param command 
 */
function getWindowsBaseArguments(command: CatCom): BaseArgumentsReturn {
    let baseCommand: string;
    let baseCommandArguments: string[];
    switch (command.execEnv) {
        case ExecEnvOption.WinPowershell:
            baseCommand = "powershell";
            baseCommandArguments = ["-NoProfile", "-Command"];
            break;

        case ExecEnvOption.WinCommandPrompt:
        case undefined: // If there isn't an execEnv defined, default to the winCommandPrompt option
            baseCommand = "cmd";
            baseCommandArguments = ["/c"];
            break;

        case ExecEnvOption.Bash:
            baseCommand = "bash";
            baseCommandArguments = ["--noprofile", "-c"];
            break;

        default:
            throw new Error("This Environment isn't supported on this platform.");
    }

    return {
        baseCommand: baseCommand,
        baseCommandArguments: baseCommandArguments,
    };
}

/**
 * 
 * @param command 
 */
function getLinuxBaseArguments(command: CatCom): BaseArgumentsReturn {
    let baseCommand: string;
    let baseCommandArguments: string[];
    switch (command.execEnv) {
        case ExecEnvOption.Bash:
        case undefined: // If there isn't an execEnv defined, default to the winCommandPrompt option
            baseCommand = "bash";
            baseCommandArguments = ["--noprofile", "-c"];
            break;

        default:
            throw new Error("This Environment isn't supported on this platform.");
    }

    return {
        baseCommand: baseCommand,
        baseCommandArguments: baseCommandArguments,
    };
}
