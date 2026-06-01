import { workerData, parentPort } from 'worker_threads';
import fs from 'node:fs/promises';

const { file, type } = workerData;

function countLines(content) {
  if (content.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') count++;
  }
  if (content[content.length - 1] !== '\n') count++;
  return count;
}

function countWords(content) {
  const trimmedContent = content.trim();
  if (!trimmedContent) return 0;
  return trimmedContent.split(/\s+/).length;
}

try {
  const [content, stat] = await Promise.all([
    fs.readFile(file, 'utf-8'),
    fs.stat(file),
  ]);

  const data = {
    arquivo: file,
    tipo: type,
    linhas: countLines(content),
    tamanhoBytes: stat.size,
    palavras: countWords(content),
    erros: null,
  };

  parentPort.postMessage(data);
} catch (err) {
  parentPort.postMessage({
    file,
    type,
    linhas: 0,
    tamanhoBytes: 0,
    palavras: 0,
    erros: err.message,
  });
}