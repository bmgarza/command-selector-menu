import { CatCom, isCategory } from "./cat-com-structs";
import { ConsoleTextReset } from "./console-colors";
import { ArgumentEnum, optionsReceived } from "./csm-console-arguments";
import { csmCategoryColor, csmCommandColor } from "./csm-console-colors";

export function getCategoryPrint(category: CatCom, index?: number): string {
    if (index !== undefined) {
        return `${index}) ${csmCategoryColor}${category.name}${ConsoleTextReset}: ${category.description}`;
    } else {
        return `${csmCategoryColor}${category.name}${ConsoleTextReset}: ${category.description}`;
    }
}

export function getCommandPrint(command: CatCom, index?: number): string {
    if (index !== undefined) {
        return `${index}) ${csmCommandColor}${command.name}${ConsoleTextReset}: ${command.description}`;
    } else {
        return `${csmCommandColor}${command.name}${ConsoleTextReset}: ${command.description}`;
    }
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
