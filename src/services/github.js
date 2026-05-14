export async function buscarIssuesGithub(repo, token, page = 1) {
  const url =
    "https://api.github.com/repos/{repo}/issues?state=open&per;_page=20&page;={page}";

  const myInit = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DevTrack/1.0",
    },
    mode: "cors",
    cache: "default",
  };

  const resposta = await fetch(url, myInit);

  if (resposta.status === 401) throw new Error("Token inválido ou expirado");
  if (resposta.status === 404)
    throw new Error(`Repositório "${repo}" não encontrado`);
  if (!resposta.ok)
    throw new Error(`HTTP ${resposta.status}: ${resposta.statusText}`);

  return resposta.json();
}

try {
  const issues = await buscarIssuesGithub(
    "microsoft/vscode",
    process.env.GITHUB_TOKEN,
  );
  console.log(`${issues.length} issues abertas`);
} catch (err) {
  console.error("Falha na busca:", err.message);
}
