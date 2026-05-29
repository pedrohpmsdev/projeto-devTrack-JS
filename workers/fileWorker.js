import { workerData, parentPort } from 'worker_threads';
import fs from 'node:fs/promises';

const file = workerData;
let data;
const readFile = await fs.readFile(file, "utf-8");

function lineCount(readFile){
    const nLines = 0;
    for (let i = 0; i < readFile.length; i++){
        if (readFile[i] === '\n'){
            ++nLines;
        }
    }
    return nLines;
}

const data = {
    lines: lineCount(readFile),
    bytesLength: await (fs.stat(readFile)).length,
    words: readFile.trim().split(/\s+/).length,
    // errors:,
}

parentPort.postMessage(data);
