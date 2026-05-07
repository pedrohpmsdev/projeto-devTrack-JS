#!/usr/bin/env node
// cli.js — Entry point do DevTrack
console.log("DevTrack v1.0");
console.log("Node:", process.version);
console.log("Plataforma:", process.platform);

import readline from "node:readline";
import { adicionarTask, atualizarTask, listarTasks } from "./src/storage/db.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.setPrompt("\nOpção escolhida: ");
rl.prompt(
  console.log(
    "\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair.",
  ),
);

rl.on("line", (line) => {
  if (line == 1) {
    const titulo = null;
    const prioridade = "media";
    const marcacao = [];
    console.log("\nAção selecionada: Adicionar.");
    rl.question("Título: ", (title) => {
      titulo = title;
      rl.close();
    });
    rl.question("Prioridade: ", (priority) => {
      prioridade = priority;
      rl.close();
    });
    rl.question("Tags: ", (tags) => {
      marcacao = tags;
      rl.close();
    });

    const novaTask = {
      titulo: titulo,
      prioridade: prioridade,
      tags: marcacao,
    };
    adicionarTask(novaTask);

    console.log(
      "\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair.",
    );
    rl.close();
  } else if (line == 2) {
    console.log("\nAção selecionada: Listar.");
    rl.question("Filtro: ", (filtro) => {
      listarTasks(filtro);
      console.log(
        "\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair.",
      );
      rl.close();
    });
  } else if (line == 3) {
    const identificador = null;
    const campos = {};
    console.log("\nAção selecionada: Atualizar task.");
    rl.question("id: ", (id) => {
      identificador = id;
    });
    rl.question("fields: ", (fields) => {
      campos = JSON.parse(fields);
    });
    atualizarTask(identificador, campos);
    console.log(
      "\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair.",
    );
    rl.close();
  } else if (line == 4) {
    console.log("Saindo...");
    rl.close();
    process.exit();
  } else {
    console.log("\nValor inválido, tente novamente.");
  }

  rl.prompt();
});
