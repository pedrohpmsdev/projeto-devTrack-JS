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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "../../data/devtrack.json");

const cache = {
  data: null,
  timestamp: 0,
};

const CACHE_TTL = 500;  

function cacheValido() {
  return cache.data !== null && (Date.now() - cache.timestamp) < CACHE_TTL;
}

function invalidarCache() {
  cache.timestamp = 0;
  process.env.DEBUG?.includes("devtrack") && console.debug("[db] Cache invalidado");
}

let watcher = null;
let debounceTimer = null;

export function iniciarWatcher() {
  if (watcher) return;  

  watcher = fs.watch(DB_PATH, (evento) => {
    if (evento === "change") {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        invalidarCache();
      }, 50);
    }
  });

  watcher.on("error", (err) => {
    console.error("[db] Erro no watcher:", err.message);
  });
}

export function fecharWatcher() {
  clearTimeout(debounceTimer);
  watcher?.close();
  watcher = null;
}

class LRUCache {
  #cache;
  #capacity;

  constructor(capacity) {
    this.#capacity = capacity;
    this.#cache = new Map();  
  }

  get(chave) {
    if (!this.#cache.has(chave)) return undefined;
    const valor = this.#cache.get(chave);  
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
  if (cacheValido()) {
    process.env.DEBUG?.includes("devtrack") && console.debug("[db] Cache hit");
    return cache.data;
  }

  try {
    if (!existsSync(DB_PATH)) {
      const estrutura = { tasks: [] };
      await writeFile(DB_PATH, JSON.stringify(estrutura, null, 2));
      cache.data = estrutura;
      cache.timestamp = Date.now();
      return estrutura;
    }

    const texto = await readFile(DB_PATH, "utf-8");
    const dados = JSON.parse(texto);

    cache.data = dados;
    cache.timestamp = Date.now();

    process.env.DEBUG?.includes("devtrack") && console.debug("[db] Cache atualizado do disco");

    return dados;
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

export async function salvarDB(dados) {
  const tmp = DB_PATH + ".tmp";
  await writeFile(tmp, JSON.stringify(dados, null, 2), "utf-8");
  await rename(tmp, DB_PATH);
  cache.data = dados;
  cache.timestamp = Date.now();
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
  if (index === -1) throw new Error(`Task ${id} não encontrada`);

  db.tasks[index] = {
    ...db.tasks[index],
    ...campos,
    atualizadaEm: new Date().toISOString(),
  };

  await salvarDB(db);
  return db.tasks[index];
}

export async function removerTask(id) {
  const db = await lerDB();  

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