import { dirname } from "path";
import { Platforms } from "./cat-com-structs";

export const currentPlatform: Platforms = <Platforms>process.platform;
export const currentPath: string = dirname(process.execPath);
