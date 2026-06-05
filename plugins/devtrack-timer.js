import { Command } from "commander";
import chalk from "chalk";
import { lerDB, atualizarTask } from "../src/storage/db.js";


async function salvarTimerNoDB(campo, valor) {
  const db = await lerDB();
  if (!db.timer) db.timer = {};
  db.timer[campo] = valor;
 
  const { default: fs } = await import("node:fs");
  const { default: path } = await import("node:path");
  const dbPath = path.resolve("data", "db.json");
  await fs.promises.writeFile(dbPath, JSON.stringify(db, null, 2));
}

const timerStart = new Command("start")
  .description("Inicia o timer — salva startTime no db.json")
  .action(async () => {
    const agora = new Date().toISOString();
    await salvarTimerNoDB("startTime", agora);
    console.log(chalk.green(`\nTimer iniciado: ${agora}`));
  });

const timerStop = new Command("stop")
  .description("Para o timer — calcula duração e salva no db.json")
  .action(async () => {
    const db = await lerDB();
    const startTime = db.timer?.startTime;

    if (!startTime) {
      console.log(chalk.red("\nNenhum timer em andamento. Use: devtrack timer start"));
      return;
    }

    const inicio = new Date(startTime);
    const fim = new Date();
    const duracaoMs = fim - inicio;
    const duracaoSeg = (duracaoMs / 1000).toFixed(1);

    await salvarTimerNoDB("endTime", fim.toISOString());
    await salvarTimerNoDB("duracaoSegundos", Number(duracaoSeg));

    console.log(chalk.green(`\nTimer encerrado.`));
    console.log(chalk.cyan(`Início  : ${startTime}`));
    console.log(chalk.cyan(`Fim     : ${fim.toISOString()}`));
    console.log(chalk.cyan(`Duração : ${duracaoSeg}s`));
  });

const timerCommand = new Command("timer")
  .description("Mede tempo gasto em uma tarefa (plugin devtrack-timer)");

timerCommand.addCommand(timerStart);
timerCommand.addCommand(timerStop);


export default {
  nome: "devtrack-timer",
  versao: "1.0.0",
  comandos: [timerCommand],
};