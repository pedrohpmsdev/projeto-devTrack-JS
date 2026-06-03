import fs from "fs";
import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  stat,
  rename,
  unlink,
  copyFile,
} from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { error } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "../../data/devtrack.json");

class LRUCache {
  #cache;
  #capacity;

  constructor(capacity) {
    this.#capacity = capacity;
    this.cache = new Map();
  }

  get(chave) {
    if (!this.#cache.has(chave)) return undefined;
    const valor = this.#chave.get(chave);
    this.#cache.delete(chave);
    this.#cache.set(chave, valor);
    return valor;
  }

  set(chave, valor) {
    if (this.#cache.has(chave)) this.#cache.delete(chave);
    else if (this.#cache.size >= this.#capacity) {
      const maisAntigo = this.#cache.keys().next().value;
      this.#cache.delete(maisAntigo);
    }
    this.#cache.set(chave, valor);
  }

  get size() {
    return this.#cache.size;
  }
}

export async function lerDB() {
  try {
    if (!existsSync(DB_PATH)) {
      const estrutura = { tasks: [] };
      await fs.writeFile(DB_PATH, JSON.stringify(estrutura, null, 2));
      return estrutura;
    }
    const texto = await readFile(DB_PATH, "utf-8");
    return JSON.parse(texto);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

export async function salvarDB(dados) {
  const tmp = DB_PATH + ".tmp";
  await writeFile(tmp, JSON.stringify(dados, null, 2), "utf-8");
  await rename(tmp, DB_PATH);
}

export async function adicionarTask(task) {
  const db = await lerDB();

  const novaTask = {
    id: randomUUID(),
    titulo: task.titulo,
    descricao: task.descricao || "",
    status: task.status || "pendente",
    prioridade: task.prioridade || "media",
    projeto: task.projeto || "",
    tags: task.tags || [],
    criadaEm: new Date().toISOString(),
    atualizadaEm: new Date().toISOString(),
  };

  db.tasks.push(novaTask);
  await salvarDB(db);

  return novaTask;
}

export async function atualizarTask(id, campos) {
  const db = await lerDB();

  const index = db.tasks.findIndex((t) => t.id === id);
  if (index === -1) throw error;

  db.tasks[index] = {
    ...db.tasks[index],
    ...campos,
    atualizadaEm: new Date().toISOString(),
  };

  await salvarDB(db);

  return db.tasks[index];
}

export async function removerTask(id) {
  const db = lerDB();

  const novaLista = db.tasks.filter((t) => t.id !== id);

  if (novaLista.length === db.tasks.length) return false;

  db.tasks = novaLista;
  await salvarDB(db);

  return true;
}

export async function listarTasks(filtro) {
  const db = await lerDB();

  return db.tasks.filter((task) => {
    return (
      (!filtro.status || task.status === filtro.status) &&
      (!filtro.prioridade || task.prioridade === filtro.prioridade) &&
      (!filtro.projeto || task.projeto === filtro.projeto)
    );
  });
}

export async function fazerBackup() {
  const db = await lerDB();

  const timestamp = new Date().toISOString().split("T")[0];
  const backupPath = path.join(
    path.dirname(DB_PATH),
    `devtrack-${timestamp}.json`,
  );

  await writeFile(backupPath, JSON.stringify(db, null, 2));
}

fazerBackup();
