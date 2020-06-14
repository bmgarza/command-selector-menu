import { dirname, extname as fileExtension, basename } from "path";
import { Platforms } from "./csm/cat-com-structs";

export const currentPlatform: Platforms = <Platforms>process.platform;
export const currentPath: string = dirname(process.execPath);

// NOTE: BMG (Jun. 13, 2020) This boolean flag tends more towards setting to production than not. There is probably a
//  case where the production flag would be incorrectly set when not in production, but it seems to me you have to go
//  out of your way to make that happen.
export const production: boolean = !(
    ( // npm start case
        process.argv[0].includes("ts-node") &&
        fileExtension(process.argv[1]) === ".ts"
    ) ||
    ( // VSCode debugging case
        process.argv[0].includes("node") &&
        fileExtension(process.argv[1]) === ".js" &&
        !process.argv[1].includes("snapshot")
    )
);
