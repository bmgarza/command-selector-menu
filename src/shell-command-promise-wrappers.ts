import {
    exec as osExec,
    ExecException,
    spawn as spawnCmd,
    spawnSync as spawnSyncCmd,
    ChildProcessWithoutNullStreams,
    SpawnOptions,
} from "child_process";

// A promise wrapper for the exec command callback in order to be able to use the command with the async await notation
export function executeCommand(commandString: string): Promise<string> {
    return new Promise((resolve: (value?: string | PromiseLike<string>) => void,
                        reject: (reason?: any) => void) => {
        osExec(
            commandString,
            (error: ExecException, stdout: string, stderr: string) => {
                if (error === null) {
                    resolve(stdout);
                } else {
                    reject(stderr);
                }
            },
        );
    });
}

const spawnOptions: SpawnOptions = {
    // Don't let the processes that are spawned be detached from the parent process
    detached: false,
    // Preserve stdio when running the command
    stdio: "inherit",
}

// A promise wrapper for the spawn comman callback in order to be able to use the command with the async await notation
export function spawnCommand(commandString: string, args?: string[]): Promise<void> {
    return new Promise((resolve: (value?: void | PromiseLike<void>) => void, reject: (reason?: any) => void) => {
        let cmd: ChildProcessWithoutNullStreams = spawnCmd(
            commandString,
            args,
            spawnOptions,
        );

        cmd.on("close", (code: number) => {
            if(code === 0) {
                resolve();
            }
            else {
                let err: Error = new Error(`Command exited with code: ${code}`)
                reject(err);
            }
        });
    });
}

export function spawnSyncCommand(commandString: string, args?: string[]): void {
    spawnSyncCmd(commandString, args, spawnOptions);
}
