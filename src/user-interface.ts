import {
    createInterface,
    Interface as readlineInterface,
} from "readline";

import {
    ConsoleTextReset,
    ConsoleTextCyan,
} from "./console-colors";

const rlInterface: readlineInterface = createInterface(
    {
        input: process.stdin,
        output: process.stdout,
    }
);

export function getOptionNumber(): Promise<number> {
    return new Promise((resolve: (value?: number | PromiseLike<number>) => void, reject: (reason?: any) => void) => {
        rlInterface.question(
            "\nEnter option number: ",
            (answer: string) => {
                const parsedInt: number = parseInt(answer);
                if(!isNaN(parsedInt)) {
                    resolve(parsedInt);
                }
                else {
                    // This function doesn't reject because handling rejects in the async notation is disgusting.
                    resolve(-1);
                }
            }
        );
    });
}

export function confirmCommand(name: string): Promise<boolean> {
    return new Promise((resolve: (value?: boolean | PromiseLike<boolean>) => void, reject: (reason?: any) => void) => {
        rlInterface.question(
            `\nAre you sure you want to run the (${ConsoleTextCyan}${name}${ConsoleTextReset}) command? `,
            (answer: string) => {
                if (answer.match(/^[Yy]+[Ee]*[Ss]*/g) !== null) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            }
        );
    });
}
