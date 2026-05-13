import { Parser } from "json2csv";
import { lerDB } from "../storage/db.js";
import fs, { createReadStream, createWriteStream } from "fs";
import zlib from "zlib";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { error, log } from "console";
import { pipeline } from "stream/promises";

export async function exportarCSV(filtro, caminhoSaida) {
  const db = await lerDB();
  const tarefas = db.tasks.filter((task) => {
    return (
      (!filtro.status || task.status === filtro.status) &&
      (!filtro.prioridade || task.prioridade === filtro.prioridade) &&
      (!filtro.projeto || task.projeto === filtro.projeto)
    );
  });

  const parser = new Parser();
  const csvData = parser.parse(tarefas);
  if (caminhoSaida == null || caminhoSaida == "") {
    caminhoSaida = "exports/output.csv";
  }
  fs.writeFileSync(caminhoSaida, csvData);
}

export async function exportarLogComprimido(caminhoSaida) {
  try {
    const db = await lerDB();

    fs.writeFileSync("exports/log.log", String(db.log));
    await pipeline(
      createReadStream("exports/log.log"),
      zlib.createGzip(),
      createWriteStream("exports/log.gz"),
    );

    fs.unlink("exports/log.log", (err) => {
      if (err) {
        console.error("Ocorreu um erro:", err);
      }
    });
  } catch (err) {
    throw err;
  }
}
