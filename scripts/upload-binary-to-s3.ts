import * as AWS from "aws-sdk";
import { readFileSync, existsSync } from "fs";

import { version } from "../package.json";
import { accessKey, secretAccessKey } from "../secret.json";

const s3 = new AWS.S3({
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
});

const bucketName: string = "command-selector-menu";
const binaryVersionConcat: string = version.replace(/\./g, "-");

interface UploadPathAndName {
    path: string;
    name: string;
}
const fileUploadList: UploadPathAndName[] = [
    {path: "./build/csm-linux",   name:`csm-linux-${binaryVersionConcat}`},
    {path: "./build/csm-win.exe", name:`csm-win-${binaryVersionConcat}.exe`},
]

uploads3Files(fileUploadList)
    .then(() => {
        process.exit(0);
    })
    .catch((error: Error) => {
        throw error;
    })
    .finally(() => {
        process.exit(1);
    });

//////////////////////////////////////////////////
// Auxiliary Functions                          //
//////////////////////////////////////////////////

async function uploads3Files(filePathsAndNames: UploadPathAndName[]): Promise<void> {
    for (const file of filePathsAndNames) {
        if (existsSync(file.path)) {
            console.log(`Uploading ${file.path} as ${file.name}`);
            const urlLocation: string = await s3UploadPromise(file);
            console.log(`File was successfully uploaded to the following URL: ${urlLocation}`);
        } else {
            console.log(`File does not exist: ${file.path}`);
        }
    }
}

function s3UploadPromise(file: UploadPathAndName): Promise<string> {
    return new Promise((resolve: (value?: string | PromiseLike<string> | undefined) => void,
                        reject: (reason?: any) => void) => {
        // Beginning of the promise
        const fileContent: Buffer = readFileSync(file.path);

        const s3Manager: AWS.S3.ManagedUpload = s3.upload(
            {
                Bucket: bucketName,
                ACL: "public-read",
                Key: file.name,
                Body: fileContent,
            },
            (err: Error, data: AWS.S3.ManagedUpload.SendData) => {
                if (err !== null) {
                    console.log(err.message);
                    // There was an error
                    reject(err);
                } else {
                    // The upload was successful
                    resolve(data.Location);
                }
            },
        );

        s3Manager.on("httpUploadProgress", (progress: AWS.S3.ManagedUpload.Progress) => {
            process.stdout.write(`Upload progress: ${Math.floor((progress.loaded / progress.total) * 100)}%\r`);
        });
    });
}
