import { CatComJSON, CatCom, isCategory } from "./cat-com-structs";

export function verifyJSONFile(catComJSONObj: CatComJSON): boolean {
    let outputBool: boolean = true;

    // Verify that all the mandatory fields in the catComJSONObj are present first, then verify the list that it
    //  contains
    outputBool = outputBool && catComJSONObj.catComList !== undefined;
    if (outputBool) {
        outputBool = verifyCatComList(catComJSONObj.catComList);
    }

    return outputBool;
}

function verifyCatComList(catComList: CatCom[]): boolean {
    let outputBool: boolean = true;

    for (const catCom of catComList) {
        outputBool = outputBool && catCom.name !== undefined;
        outputBool = outputBool && catCom.description !== undefined;
        outputBool = outputBool && catCom.subCatCom !== undefined;

        if (!outputBool) break;

        if (isCategory(catCom)) {
            // At this point we know that the subCatCom key contains a list of CatCom
            outputBool = verifyCatComList(<CatCom[]>catCom.subCatCom);

            if (!outputBool) break;
        }
    }

    return outputBool;
}

// export function sortJSONFile(catComJSONObj: CatComJSON): void {
//     // TODO: BG (May. 04, 2020) Finish this function
// }
