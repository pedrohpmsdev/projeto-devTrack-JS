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
import { criarBranchDaTarefa } from "./src/services/git.js";
import { Command } from "commander";
import chalk from "chalk";

const program = new Command()
  .name("devtrack")
  .description("CLI para gerenciamento de projetos")
  .version("1.0.0");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

process.on("SIGINT", () => {
  console.log(chalk.green("\n*Aplicação encerrada pelo usuário (Ctrl+C)."));
  rl.close();
  process.exit(0);
});

rl.setPrompt("\nOpção escolhida: ");

rl.prompt(
  console.log(chalk.gray(
    "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub;\n 8. Vincular tarefa à branch atual.",
  )),
);

rl.on("line", (line) => {
  if (line == 1) {
    const titulo = null;
    const prioridade = "media";
    const marcacao = [];
    console.log(chalk.green("\nAção selecionada: Adicionar."));

    program
      .command("add <titulo>")
      .description("Adiciona uma nova tarefa")
      .option("-p, --prioridade <n>", "alta|media|baixa", "media")
      .option("-t, --tags <tags...>", "tags da tarefa")
      .option("-P, --projeto <nome>", "projeto associado")
      .action(async (titulo, opts) => {
        const novaTask = {
          titulo,
          prioridade: opts.prioridade,
          tags: opts.tags.split(","),
          projeto: opts.projeto,
        };
        await adicionarTask(novaTask);
      });

    console.log(chalk.gray(
      "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub;\n 8. Vincular tarefa à branch atual.",
    ));
  } else if (line == 2) {
    console.log(chalk.green("\nAção selecionada: Listar."));
    rl.question("Filtro: ", async (filtro) => {
      const filtroObj = filtro.trim() ? JSON.parse(filtro) : {};
      const tasks = await listarTasks(filtroObj);
      console.log(chalk.gray(
        chalk.cyan("ID".padEnd(10)),
        "Título".padEnd(30),
        "Prioridade".padEnd(15),
        "Status".padEnd(15),
      ));
      console.log(
        "-----------------------------------------------------------------------",
      );
      tasks.forEach((task) => {
        console.log(chalk.gray(
          chalk.cyan(task.id.slice(0, 8).padEnd(10)),
          task.titulo.padEnd(30),
          task.prioridade.padEnd(15),
          task.status.padEnd(15),
        ));
      });
      console.log(
        "-----------------------------------------------------------------------",
      );
      console.log(chalk.gray(
        "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub;\n 8. Vincular tarefa à branch atual.",
      ));
    });
  } else if (line == 3) {
    const campos = {};
    console.log(chalk.green("\nAção selecionada: Atualizar task."));
    rl.question("id: ", (id) => {
      rl.question("Status: ", (status) => {
        atualizarTask(id, { status: status });
        console.log(chalk.gray(
          "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub;\n 8. Vincular tarefa à branch atual.",
        ));
      });
    });
  } else if (line == 4) {
    console.log(chalk.green("Saindo..."));
    rl.close();
    process.exit();
  } else if (line == 5) {
    console.log(chalk.green("\nAção selecionada: Exporta CSV."));
    rl.question("Filtro: ", (filtro) => {
      rl.question("Caminho de Saída: ", (caminhoSaida) => {
        exportarCSV(filtro, caminhoSaida);
        console.log(chalk.gray(
          "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub;\n 8. Vincular tarefa à branch atual.",
        ));
      });
    });
  } else if (line == 6) {
    console.log(chalk.gree("\nAção selecionada: Exportar log comprimido."));
    rl.question("Caminho de Saída: ", (caminhoSaida) => {
      exportarLogComprimido(caminhoSaida);
      console.log(chalk.gray(
        "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub;\n 8. Vincular tarefa à branch atual.",
      ));
    });
  } else if (line == 7) {
    console.log(chalk.green("\nAção selecionada: Importar issues do GitHub."));
    rl.question("Link do Repositório: ", async (repo) => {
      const resultado = await buscarIssuesGithub(
        repo,
        process.env.GITHUB_TOKEN,
      );

      console.log(chalk.gray(resultado.issues));
      console.log(chalk.gray(`\nTem próxima página? ${resultado.hasNextPage}\n`));
      console.log(
        chalk.gray("\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub;\n 8. Vincular tarefa à branch atual.",
      ));
    });
  } else if (line == 8) {
    console.log(chalk.green("\nAção selecionada: Importar issues do GitHub."));
    rl.question("Id: ", async (id) => {
      rl.question("Título: ", async (titulo) => {
        criarBranchDaTarefa(id, titulo); //ver só se n é sempre um valor fixo
        console.log(
          chalk.gray("\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub;\n 8. Vincular tarefa à branch atual.",
        ));
      });
    });
  } else {
    2;
    console.log(chalk.red("\nValor inválido, tente novamente."));
  }

  rl.prompt();
});

const data = {
  id: 123,
  message: chalk.green("Operação concluída"),
  timestamp: new Date().toISOString(),
};

if (!process.stdout.isTTY) {
  console.log(JSON.stringify(data));
} else {
  console.log(`✅ ${data.message} (ID: ${data.id})`);
}
