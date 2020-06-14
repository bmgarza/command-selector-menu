import { createInterface, Interface as readlineInterface } from "readline";

import { ConsoleTextReset } from "../console-colors";

import { csmCommandColor } from "./csm-console-colors";

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
                if (answer === "") {
                    reject(new Error("No value was entered."));
                }

                if (answer === "exit") {
                    reject(new Error("Exit value was entered."));
                }

                const parsedInt: number = parseInt(answer);
                if(!isNaN(parsedInt)) {
                    resolve(parsedInt);
                }
                else {
                    // This function doesn't reject because handling rejects in the async notation is disgusting.
                    // resolve(-1);
                    reject(new Error(`The value entered is not a valid number (${answer}).`));
                }
            }
        );
    });
}

export function confirmCommand(name: string): Promise<boolean> {
    return new Promise((resolve: (value?: boolean | PromiseLike<boolean>) => void, reject: (reason?: any) => void) => {
        rlInterface.question(
            `\nAre you sure you want to run the (${csmCommandColor}${name}${ConsoleTextReset}) command? `,
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
