import { Parser } from "json2csv";
import { lerDB } from "../storage/db.js";
import fs from "fs";
import zlib from "zlib";
import {
  readFile,
  writeFile,
} from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { error, log } from "console";

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
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const DB_PATH = path.join(__dirname, "../../data/devtrack.json");
    if (!existsSync(DB_PATH)) {
      const estrutura = { log: [] };
      await fs.writeFile(DB_PATH, JSON.stringify(estrutura, null, 2));
      return estrutura;
    }
    const texto = await readFile(DB_PATH, "utf-8");
    const db = JSON.parse(texto);
    const logZip = zlib.createGzip(db);
    if (caminhoSaida == null || caminhoSaida == "") {
      caminhoSaida = "exports/output.zip";
    }
    return logZip;
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}
