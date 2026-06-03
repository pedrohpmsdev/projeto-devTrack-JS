#!/usr/bin/env node
// cli.js — Entry point do DevTrack
console.log("DevTrack v1.0");
console.log("Node:", process.version);
console.log("Plataforma:", process.platform);

import fs from "fs";
import path from "node:path";
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
import inquirer from "inquirer";
import os from "os";

const program = new Command();

program
  .name("devtrack")
  .description("CLI para gerenciamento de projetos")
  .version("1.0.0");

// fs.readdir(path.join("/", "Users", "lorai", "devTrack", "plugins")).then((files) => {
//   files.forEach(file => {
//     import(file);
//   }) 
// }); 

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
  .command("new")
  .description("Criar nova task no modo guiado")
  .action(async () => {
    try {
      const db = await lerDB();

      const projetos = [
        ...new Set(db.tasks.map((task) => task.projeto).filter(Boolean)),
      ];

      const respostas = await inquirer.prompt([
        {
          type: "input",
          name: "titulo",
          message: "Título da tarefa:",
          validate(input) {
            if (input.trim().length < 3) {
              return "Título deve ter ao menos 3 caracteres";
            }

            if (input.trim().length > 100) {
              return "Título deve ter no máximo 100 caracteres";
            }

            return true;
          },
        },

        {
          type: "input",
          name: "descricao",
          message: "Descrição da tarefa:",
        },

        {
          type: "list",
          name: "prioridade",
          message: "Prioridade:",
          choices: ["alta", "media", "baixa"],
        },

        {
          type: "list",
          name: "projeto",
          message: "Projeto:",
          choices: [...projetos, "Criar novo projeto"],
        },

        {
          type: "checkbox",
          name: "tags",
          message: "Tags:",
          choices: ["frontend", "backend", "bug", "feature"],
        },
      ]);

      let projetoFinal = respostas.projeto;

      if (respostas.projeto === "Criar novo projeto") {
        const novoProjeto = await inquirer.prompt([
          {
            type: "input",
            name: "nomeProjeto",
            message: "Nome do novo projeto:",

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

      console.log(
        chalk.cyan("Tags:"),
        respostas.tags.length > 0 ? respostas.tags.join(", ") : "Nenhuma",
      );

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

program
  .command("analyze")
  .description(
    "lista arquivos .log e .csv e os processa em paralelo com Worker Threads",
  )
  .option("-d, --dir <diretorio>", "diretório para escanear", ".")
  .action(async (opts) => {
    const inicio = performance.now();

    try {
      const entradas = await fs.readdir(opts.dir, { withFileTypes: true });

      const arquivos = entradas
        .filter(
          (e) =>
            e.isFile() && (e.name.endsWith(".log") || e.name.endsWith(".csv")),
        )
        .map((e) => ({
          arquivo: path.join(opts.dir, e.name),
          tipo: path.extname(e.name).slice(1),
        }));

      if (arquivos.length === 0) {
        console.log(chalk.yellow("\nNenhum arquivo .log ou .csv encontrado."));
        return;
      }

      console.log(
        chalk.cyan(
          `\nEncontrados ${arquivos.length} arquivo(s). Processando...\n`,
        ),
      );

      const maxWorkers = os.cpus().length;
      const resultados = [];
      let concluidos = 0;

      for (let i = 0; i < arquivos.length; i += maxWorkers) {
        const lote = arquivos.slice(i, i + maxWorkers);

        const promises = lote.map((item) =>
          executarWorker(item).then((resultado) => {
            concluidos++;
            process.stdout.write(
              chalk.gray(
                `\rProcessando ${concluidos}/${arquivos.length} arquivos...`,
              ),
            );
            return resultado;
          }),
        );

        const settled = await Promise.allSettled(promises);

        settled.forEach((s) => {
          if (s.status === "fulfilled") {
            resultados.push(s.value);
          } else {
            resultados.push({
              erros: s.reason?.message ?? "Erro desconhecido",
            });
          }
        });
      }

      const fim = performance.now();
      const tempoTotal = ((fim - inicio) / 1000).toFixed(3);

      const totalLinhas = resultados.reduce(
        (acc, r) => acc + (r.linhas ?? 0),
        0,
      );
      const totalBytes = resultados.reduce(
        (acc, r) => acc + (r.tamanhoBytes ?? 0),
        0,
      );
      const totalPalavras = resultados.reduce(
        (acc, r) => acc + (r.palavras ?? 0),
        0,
      );
      const comErro = resultados.filter((r) => r.erros).length;

      console.log("\n");

      resultados.forEach((r) => {
        if (r.erros) {
          console.log(
            chalk.red(
              `${String(r.arquivo ?? "?").padEnd(30)} ERRO: ${r.erros}`,
            ),
          );
        } else {
          console.log(
            chalk.white(
              `${path.basename(r.arquivo).padEnd(30)} ${r.tipo.padEnd(6)} ${String(r.linhas).padEnd(10)} ${String(r.palavras).padEnd(12)} ${r.tamanhoBytes}`,
            ),
          );
        }
      });
      console.log(
        chalk.cyan(`  Total de arquivos : `) + chalk.white(arquivos.length),
      );
      console.log(
        chalk.cyan(`  Total de linhas   : `) + chalk.white(totalLinhas),
      );
      console.log(
        chalk.cyan(`  Tamanho total     : `) +
          chalk.white(`${(totalBytes / 1024).toFixed(2)} KB`),
      );
      console.log(
        chalk.cyan(`  Tempo total       : `) + chalk.white(`${tempoTotal}s`),
      );
      console.log(
        chalk.cyan(`  Workers usados    : `) +
          chalk.white(
            `${Math.min(maxWorkers, arquivos.length)} (máx ${maxWorkers})`,
          ),
      );
      if (comErro > 0) {
        console.log(chalk.red(`  Arquivos com erro : ${comErro}`));
      }
    } catch (err) {
      console.error(chalk.red("\nErro no comando analyze:"), err.message);
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

async function processarEmParalelo(lotes) {
  const maxWorkers = os.cpus().length;
  const resultados = [];

  for (let i = 0; i < lotes.length; i += maxWorkers) {
    const batch = lotes.slice(i, i + maxWorkers);
    const promises = batch.map((lotes) => executarWorker(lote));
    resultados.push(...(await Promise.all(promises)));
  }

  return resultados;
}

function executarWorker(dados) {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL("./worker.js", import.meta.url), {
      workerData: dados,
    });
    w.on("message", resolve);
    w.on("error", reject);
    w.on("exit", (code) => {
      if (code !== 0) reject(new Error(`Worker saiu com código ${code}`));
    });
  });
}
