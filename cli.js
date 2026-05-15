#!/usr/bin/env node
// cli.js — Entry point do DevTrack
console.log("DevTrack v1.0");
console.log("Node:", process.version);
console.log("Plataforma:", process.platform);

import "dotenv/config";
import readline from "node:readline";
import { adicionarTask, atualizarTask, listarTasks } from "./src/storage/db.js";
import { exportarCSV, exportarLogComprimido } from "./src/services/export.js";
import { buscarIssuesGithub } from "./src/services/github.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

process.on("SIGINT", () => {
  console.log("\n*Aplicação encerrada pelo usuário (Ctrl+C).");
  rl.close();
  process.exit(0);
});

rl.setPrompt("\nOpção escolhida: ");

rl.prompt(
  console.log(
    "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub. ",
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
            "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub. ",
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
        "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub. ",
      );
    });
  } else if (line == 3) {
    const campos = {};
    console.log("\nAção selecionada: Atualizar task.");
    rl.question("id: ", (id) => {
      rl.question("Status: ", (status) => {
        atualizarTask(id, { status: status });
        console.log(
          "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub. ",
        );
      });
    });
  } else if (line == 4) {
    console.log("Saindo...");
    rl.close();
    process.exit();
  } else if (line == 5) {
    console.log("\nAção selecionada: Exporta CSV.");
    rl.question("Filtro: ", (filtro) => {
      rl.question("Caminho de Saída: ", (caminhoSaida) => {
        exportarCSV(filtro, caminhoSaida);
        console.log(
          "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub. ",
        );
      });
    });
  } else if (line == 6) {
    console.log("\nAção selecionada: Exportar log comprimido.");
    rl.question("Caminho de Saída: ", (caminhoSaida) => {
      exportarLogComprimido(caminhoSaida);
      console.log(
        "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub. ",
      );
    });
  } else if (line == 7) {
    console.log("\nAção selecionada: Importar issues do GitHub.");
    rl.question("Link do Repositório: ", async (repo) => {
      const resultado = await buscarIssuesGithub(
        repo,
        process.env.GITHUB_TOKEN,
      );

      console.log(resultado.issues);
      console.log(`\nTem próxima página? ${resultado.hasNextPage}\n`);
      console.log(
        "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub. ",
      );
    });
  } else {
    console.log("\nValor inválido, tente novamente.");
  }

  rl.prompt();
});

const data = {
  id: 123,
  message: "Operação concluída",
  timestamp: new Date().toISOString(),
};

if (!process.stdout.isTTY) {
  console.log(JSON.stringify(data));
} else {
  console.log(`✅ ${data.message} (ID: ${data.id})`);
}
