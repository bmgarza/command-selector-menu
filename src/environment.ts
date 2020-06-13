import { dirname, extname as fileExtension } from "path";
import { Platforms } from "./cat-com-structs";

export const currentPlatform: Platforms = <Platforms>process.platform;
export const currentPath: string = dirname(process.execPath);

export const production: boolean = fileExtension(process.argv[1]) === ".js";
