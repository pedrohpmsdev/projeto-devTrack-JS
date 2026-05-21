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

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

process.on("SIGINT", () => {
  console.log(chalk.green("\n*Aplicação encerrada pelo usuário (Ctrl+C)."));
  rl.close();
  process.exit(0);
});

// rl.setPrompt("\nOpção escolhida: ");

// rl.prompt(
//   console.log(chalk.gray(
//     "\n==========MENU==========\n\nEscolha uma opção:\n 1. Adicionar;\n 2. Listar;\n 3. Atualizar status;\n 4. Sair;\n 5. Exportar CSV;\n 6. Exportar log comprido;\n 7. Importar issues do GitHub;\n 8. Vincular tarefa à branch atual.",
//   )),
// );

const titulo = null;
const prioridade = "media";
const marcacao = [];
program
  .command("add <titulo>")
  .description("Adiciona uma nova tarefa")
  .option("-p, --prioridade <n>", "alta|media|baixa", "media")
  .option("-t, --tags <tags...>", "tags da tarefa")
  .option("-P, --projeto <nome>", "projeto associado")
  .action(async (titulo, opts) => {
    console.log(chalk.green("\nAção selecionada: Adicionar."));
    const novaTask = {
      titulo,
      prioridade: opts.prioridade,
      tags: opts.tags.split(",") | [],
      projeto: opts.projeto,
    };
    await adicionarTask(novaTask);
  });

program.parse(process.argv);
program
  .command("listar")
  .description("listar tarefas")
  .option("-p, --prioridade <n>", "alta|media|baixa", "media")
  .option("-s, --status <nome>", "status")
  .option("-P, --projeto <nome>", "projeto associado")

  .action(async (filtro) => {
    const filtroObj = filtro.trim() ? JSON.parse(filtro) : {};
    const tasks = await listarTasks(filtroObj);
    console.log(
      chalk.gray(
        chalk.cyan("ID".padEnd(10)),
        "Título".padEnd(30),
        "Prioridade".padEnd(15),
        "Status".padEnd(15),
      ),
    );
    console.log(
      "-----------------------------------------------------------------------",
    );
    tasks.forEach((task) => {
      console.log(
        chalk.gray(
          chalk.cyan(task.id.slice(0, 8).padEnd(10)),
          task.titulo.padEnd(30),
          task.prioridade.padEnd(15),
          task.status.padEnd(15),
        ),
      );
    });

    console.log(
      "-----------------------------------------------------------------------",
    );
    program.parse(process.argv);
  });

program
  .command("atualizar <titulo>")
  .description("Atualizar uma tarefa")
  .option("-i, --id <id>", "id da tarefa")
  .option("-s, --status <status>", "status")
  .action(async (id, status) => {
    const campos = {};
    console.log(chalk.green("\nAção selecionada: Atualizar task."));

    atualizarTask(id, { status: status });
    program.parse(process.argv);
  });

program.command("exit").action(async () => {
  console.log(chalk.green("Saindo..."));
  process.exit();
});
program
  .command("exportCsv")
  .description("Exporta csv")
  .option("-f, --filtro <filtro>")
  .option("-c, --caminhoSaida <caminhoSaida>")
  .action(async (filtro, caminhoSaida) => {
    console.log(chalk.green("\nAção selecionada: Exporta CSV."));
    exportarCSV(filtro, caminhoSaida);
    program.parse(process.argv);
  });

program
  .command("exportarComp")
  .description("Exportar log comprimido")
  .option("-c, --caminhoSaida <caminhoSaida>")
  .action(async (caminhoSaida) => {
    console.log(chalk.green("\nAção selecionada: Exportar log comprimido."));
    exportarLogComprimido(caminhoSaida);
    program.parse(process.argv);
  });
program
  .command("importIssues")
  .description("Importar issues do GitHub")
  .option("-r, --repo <repo>")
  .action(async (repo) => {
    console.log(chalk.green("\nAção selecionada: Importar issues do GitHub."));
    const resultado = await buscarIssuesGithub(repo, process.env.GITHUB_TOKEN);

    console.log(chalk.gray(resultado.issues));
    console.log(chalk.gray(`\nTem próxima página? ${resultado.hasNextPage}\n`));
    program.parse(process.argv);
  });
program
  .command("vincBranch")
  .description("Vincular tarefa à branch atual")
  .option("-i, --id <id>", "id da tarefa")
  .option("-t, --titulo <titulo>", "titulo da tarefa")
  .action(async (id, titulo) => {
    console.log(
      chalk.green("\nAção selecionada: Vincular tarefa à branch atual."),
    );
    criarBranchDaTarefa(id, titulo);
    program.parse(process.argv);
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
