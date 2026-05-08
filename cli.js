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

process.on("SIGINT", () => {
  console.log("\n*Aplicação encerrada pelo usuário (Ctrl+C).");
  rl.close();
  process.exit();
});

rl.setPrompt("\nOpção escolhida: ");

rl.prompt(
  console.log(
    "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair.",
  ),
);

rl.on("line", (line) => {
  if (line == 1) {
    const titulo = null;
    const prioridade = "media";
    const marcacao = [];
    console.log("\nAção selecionada: Adicionar.");
    rl.question("Título: ", (titulo) => {
      rl.question("Prioridade: ", (prioridade) => {
        rl.question("Tags: ", (tags) => {
          const novaTask = {
            titulo,
            prioridade,
            tags: tags.split(","),
          };

          adicionarTask(novaTask);
          console.log(
            "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair.",
          );
        });
      });
    });
  } else if (line == 2) {
    console.log("\nAção selecionada: Listar.");
    rl.question("Filtro: ", async (filtro) => {
      const filtroObj = filtro.trim() ? JSON.parse(filtro) : {};
      const tasks = await listarTasks(filtroObj);
      console.log(
        "ID".padEnd(10),
        "Título".padEnd(30),
        "Prioridade".padEnd(15),
        "Status".padEnd(15),
      );
      console.log(
        "-----------------------------------------------------------------------",
      );
      tasks.forEach((task) => {
        console.log(
          task.id.slice(0, 8).padEnd(10),
          task.titulo.padEnd(30),
          task.prioridade.padEnd(15),
          task.status.padEnd(15),
        );
      });
      console.log(
        "-----------------------------------------------------------------------",
      );
      console.log(
        "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair.\n",
      );
    });
  } else if (line == 3) {
    const campos = {};
    console.log("\nAção selecionada: Atualizar task.");
    rl.question("id: ", (id) => {
      rl.question("status: ", (status) => {
        atualizarTask(id, { status: status });
        console.log(
          "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair.",
        );
      });
    });
  } else if (line == 4) {
    console.log("Saindo...");
    rl.close();
    process.exit();
  } else {
    console.log("\nValor inválido, tente novamente.");
  }

  rl.prompt();
});
