import { CatCom, isCategory } from "./cat-com-structs";
import { ConsoleTextReset } from "../console-colors";
import { ArgumentEnum, optionsReceived } from "./console-arguments";
import { csmCategoryColor, csmCommandColor } from "./csm-console-colors";

export function getCategoryPrint(category: CatCom, index?: number): string {
    let printString: string = "";
    if (index !== undefined) {
        printString = printString.concat(`${index}) `);
    }

    printString = printString.concat(`${csmCategoryColor}${category.name}${ConsoleTextReset}`);

    if (
        category.description !== undefined &&
        /\S/.test(category.description) // Test to see if any non-space characters exist in the string
    ) {
        printString = printString.concat(`: ${category.description}`);
    }

    return printString;
}

export function getCommandPrint(command: CatCom, index?: number): string {
    let printString: string = "";
    if (index !== undefined) {
        printString = printString.concat(`${index}) `);
    }

    printString = printString.concat(`${csmCommandColor}${command.name}${ConsoleTextReset}`);

    if (
        command.description !== undefined &&
        /\S/.test(command.description) // Test to see if any non-space characters exist in the string
    ) {
        printString = printString.concat(`: ${command.description}`);
    }

    return printString;
}

export function listCommands(catComObjList: CatCom[]): void {
    for(let i = 0; i < catComObjList.length; i++) {
        // If the first element in the subCatCom is a string, we know that it isn't a category.
        if(isCategory(catComObjList[i])) {
            console.log(getCategoryPrint(catComObjList[i], optionsReceived[ArgumentEnum.ONEBASE] ? i+1 : i));
        }
        else {
            console.log(getCommandPrint(catComObjList[i], optionsReceived[ArgumentEnum.ONEBASE] ? i+1 : i));
        }
    }
}
