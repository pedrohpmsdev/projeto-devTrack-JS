import { exec, execSync, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function getBranch() {
  try {
    const branch = execSync("git branch --show-current", {
      cwd: process.cwd(),
    });
    return branch.toString().trim() || null;
  } catch (error) {
    return null;
  }
}

export async function getUltimoCommit() {
  try {
    const { stdout } = await execAsync(
      'git log --pretty=format:"%H|%s|%an|%ai" -1',
      { cwd: process.cwd() },
    );
    const [hash, mensagem, autor, data] = stdout.toString().trim().split("|");
    return { hash, mensagem, autor, data };
  } catch (error) {
    return null;
  }
}

export async function getStatusArquivos() {
  try {
    const { stdout } = await execAsync("git status --porcelain", {
      cwd: process.cwd(),
    });

    if (!stdout.trim()) return [];

    return stdout
      .trim()
      .split("\n")
      .map((linha) => {
        const rawStatus = linha.substring(0, 2);
        const arquivo = linha.substring(3).trim();

        let status;

        if (rawStatus.includes("?")) {
          status = "?";
        } else {
          status = rawStatus.trim().charAt(0);
        }

        return { status, arquivo };
      });
  } catch (error) {
    return [];
  }
}

export async function criarBranchDaTarefa(id, titulo) {
  const id8 = String(id).substring(0, 8);
  const slug = titulo.toLowerCase().replace(/\s+/g, '-').slice(0, 30);
  
  const nomeBranch = `feat/DT-${id8}-${slug}`;
  
  try {
    await execAsync(`git checkout -b ${nomeBranch}`, {
      cwd: process.cwd(),
    }); 
    return nomeBranch;
  } catch (error) {
    throw new Error(`Falha ao criar a branch: ${error.message}`);
  }
}


 