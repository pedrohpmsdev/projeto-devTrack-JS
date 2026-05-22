#!/usr/bin/env node
// cli.js — Entry point do DevTrack
console.log("DevTrack v1.0");
console.log("Node:", process.version);
console.log("Plataforma:", process.platform);

import "dotenv/config";
import readline from "node:readline";
import {
  adicionarTask,
  atualizarTask,
  lerDB,
  listarTasks,
  removerTask,
} from "./src/storage/db.js";
import { exportarCSV, exportarLogComprimido } from "./src/services/export.js";
import { buscarIssuesGithub } from "./src/services/github.js";
import { criarBranchDaTarefa } from "./src/services/git.js";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";

const program = new Command();

program
  .name("devtrack")
  .description("CLI para gerenciamento de projetos")
  .version("1.0.0");

process.on("SIGINT", () => {
  console.log(chalk.green("\n*Aplicação encerrada pelo usuário (Ctrl+C)."));
  rl.close();
  process.exit(0);
});

program
  .command("add <titulo>")
  .description("Adicionar nova tarefa")
  .option("-p, --prioridade <prioridade>", "alta|media|baixa", "media")
  .option("-P, --projeto <projeto>", "nome do projeto")
  .option("-t, --tags <tags>", "tags separadas por vírgula")
  .option("-d, --descricao <descricao>", "descrição da tarefa")
  .action(async (titulo, opts) => {
    try {
      const novaTask = await adicionarTask({
        titulo,
        prioridade: opts.prioridade,
        projeto: opts.projeto || "",
        descricao: opts.descricao || "",
        tags: opts.tags ? opts.tags.split(",") : [],
      });

      console.log(chalk.green("\nTask criada com sucesso"));
      console.log(chalk.cyan(`ID: ${novaTask.id}`));
    } catch (err) {
      console.error(chalk.red("\nErro ao criar task"));
      console.error(chalk.red(err.message));
    }
  });

program
  .command("list")
  .description("Listar tarefas")
  .option("-s, --status <status>", "filtrar por status")
  .option("-p, --prioridade <prioridade>", "filtrar por prioridade")
  .option("-P, --projeto <projeto>", "filtrar por projeto")
  .option("--json", "saída em JSON")
  .action(async (opts) => {
    try {
      const filtro = {
        status: opts.status,
        prioridade: opts.prioridade,
        projeto: opts.projeto,
      };

      const tasks = await listarTasks(filtro);

      if (opts.json) {
        console.log(JSON.stringify(tasks, null, 2));
        return;
      }

      if (tasks.length === 0) {
        console.log(chalk.yellow("\nNenhuma task encontrada."));
        return;
      }

      console.log();

      console.log(
        chalk.gray(
          chalk.cyan("ID".padEnd(10)),
          "Título".padEnd(30),
          "Prioridade".padEnd(15),
          "Status".padEnd(15),
        ),
      );

      console.log(
        "-------------------------------------------------------------------",
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
        "-------------------------------------------------------------------",
      );
    } catch (err) {
      console.error(chalk.red("\nErro ao listar tasks"));
      console.error(chalk.red(err.message));
    }
  });

program
  .command("update")
  .description("Atualizar uma task")
  .requiredOption("-i, --id <id>", "ID da task")
  .option("-s, --status <status>", "novo status")
  .option("-p, --prioridade <prioridade>", "nova prioridade")
  .option("-t, --titulo <titulo>", "novo título")
  .action(async (opts) => {
    try {
      const campos = {};

      if (opts.status) campos.status = opts.status;
      if (opts.prioridade) campos.prioridade = opts.prioridade;
      if (opts.titulo) campos.titulo = opts.titulo;

      const taskAtualizada = await atualizarTask(opts.id, campos);

      console.log(chalk.green("\nTask atualizada"));
      console.log(chalk.cyan(`ID: ${taskAtualizada.id}`));
    } catch (err) {
      console.error(chalk.red("\nErro ao atualizar task"));
      console.error(chalk.red(err.message));
    }
  });

program
  .command("remove")
  .description("Remover task")
  .requiredOption("-i, --id <id>", "ID da task")
  .action(async (opts) => {
    try {
      const removida = await removerTask(opts.id);

      if (!removida) {
        console.log(chalk.red("\nTask não encontrada"));
        return;
      }

      console.log(chalk.green("\nTask removida com sucesso"));
    } catch (err) {
      console.error(chalk.red("\nErro ao remover task"));
      console.error(chalk.red(err.message));
    }
  });

program
  .command("export")
  .description("Exportar dados")
  .option("-c, --csv <caminho>", "exportar CSV")
  .option("-l, --log <caminho>", "exportar log comprimido")
  .action(async (opts) => {
    const spinner = ora("Exportando dados...").start();

    try {
      if (opts.csv) {
        await exportarCSV({}, opts.csv);
      }

      if (opts.log) {
        await exportarLogComprimido(opts.log);
      }

      spinner.succeed("Exportação concluída");
    } catch (err) {
      spinner.fail("Erro na exportação");
      console.error(chalk.red(err.message));
    }
  });

program
  .command("github")
  .description("Importar issues do GitHub")
  .requiredOption("-r, --repo <repo>", "repositório")
  .action(async (opts) => {
    const spinner = ora("Buscando issues...").start();

    try {
      const resultado = await buscarIssuesGithub(
        opts.repo,
        process.env.GITHUB_TOKEN,
      );

      spinner.succeed("Issues carregadas");

      console.log(chalk.gray("\nIssues:\n"));
      console.log(resultado.issues);

      console.log(
        chalk.gray(`\nTem próxima página? ${resultado.hasNextPage}\n`),
      );
    } catch (err) {
      spinner.fail("Erro ao buscar issues");
      console.error(chalk.red(err.message));
    }
  });

program
  .command("git")
  .description("Criar branch vinculada à task")
  .requiredOption("-i, --id <id>", "ID da task")
  .requiredOption("-t, --titulo <titulo>", "título da task")
  .action(async (opts) => {
    const spinner = ora("Criando branch...").start();

    try {
      await criarBranchDaTarefa(opts.id, opts.titulo);

      spinner.succeed("Branch criada com sucesso");
    } catch (err) {
      spinner.fail("Erro ao criar branch");
      console.error(chalk.red(err.message));
    }
  });

program
  .command("devtrack new")
  .option("")
  .option("")
  .option("")
  .option("")
  .action(async (opts) => {
    try {
      const db = await lerDB();

      const projetos = [
        new Set(db.task.map((task) => task.projeto).filter(boolean)),
      ];

      const respostas = inquirer.prompt([
        {
          type: "input",
          name: "titulo",
          message: "Título da tarefa:",
          validate(input) {
            if (input.length >= 3) {
              return "Título deve ter ao menos 3 caracteres";
            }
            if (input.length <= 100) {
              return "Título deve ter mo máximo 100 caracteres";
            }

            return true;
          },
        },
        { type: "input", name: "descricao", message: "Descrição da tarefa" },
        {
          type: list,
          name: "prioridade",
          message: "Prioridade",
          choices: ["alta", "media", "baixa"],
        },
        {
          type: list,
          name: "projeto",
          message: "Projeto",
          choices: [...projetos, "Criar novo projeto"],
        },
        {
          type: "checkbox",
          name: "tags",
          message: "Tags",
          choices: ["frontend", "backend", "bug", "feature"],
        },
        {
          type: "confirm",
          name: "confirmar",
          message: "Criar tarefa?",
          default: true,
        },
      ]);

      let projeto = respostas.projeto;

      if (projeto === "Criar novo projeto") {
        const novoProjeto = inquirer.promptO([
          {
            type: "input",
            name: "nomeProjeto",
            message: "Nome do novo projeto: ",
            validate(input) {
              if (!input.trim()) {
                return "Nome inválido";
              }
              return true;
            },
          },
        ]);

        projetoFinal = novoProjeto.nomeProjeto;
      }
      console.log(chalk.gray("\n========== RESUMO ==========\n"));

      console.log(chalk.cyan("Título:"), respostas.titulo);

      console.log(chalk.cyan("Descrição:"), respostas.descricao);

      console.log(chalk.cyan("Prioridade:"), respostas.prioridade);

      console.log(chalk.cyan("Projeto:"), projetoFinal);

      console.log(chalk.cyan("Tags:"), respostas.tags.join(", "));

      console.log(chalk.gray("\n============================\n"));

      const confirmacao = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmar",
          message: "Criar esta tarefa?",
          default: true,
        },
      ]);

      if (!confirmacao.confirmar) {
        console.log(chalk.yellow("\nOperação cancelada."));
        return;
      }

      const novaTask = await adicionarTask({
        titulo: respostas.titulo,
        descricao: respostas.descricao,
        prioridade: respostas.prioridade,
        projeto: projetoFinal,
        tags: respostas.tags,
      });

      const dbAtualizado = await lerDB();

      const quantidadeProjeto = dbAtualizado.tasks.filter(
        (task) => task.projeto === projetoFinal,
      ).length;

      console.log(chalk.green("\nTask criada com sucesso"));

      console.log(chalk.cyan(`ID: ${novaTask.id}`));

      console.log(
        chalk.gray(
          `Projeto "${projetoFinal}" agora possui ${quantidadeProjeto} tarefa(s).`,
        ),
      );
    } catch (e) {
      if (e.name === "ExitPromptError") {
        console.log(chalk.yellow("\nOperação cancelada pelo usuário."));
        process.exit(0);
      }

      console.log(chalk.red("\nErro inesperado"));
      console.log(chalk.red(e.message));
    }
  });

process.on("SIGINT", () => {
  console.log(chalk.green("\n\nAplicação encerrada pelo usuário."));
  process.exit(0);
});

program.parse();

const data = {
  id: 123,
  message: chalk.green("Operação concluída"),
  timestamp: new Date().toISOString(),
};

if (!process.stdout.isTTY) {
  console.log(JSON.stringify(data));
} else {
  console.log(`${data.message} (ID: ${data.id})`);
}
