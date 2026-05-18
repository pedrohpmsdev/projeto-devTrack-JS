export async function buscarIssuesGithub(repo, token, page = 1) {

  const url = `https://api.github.com/repos/${repo}/issues?state=open&per_page=20&page=${page}`;

  const myInit = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DevTrack/1.0",
    },
  };

  const resposta = await fetch(url, myInit);

  if (resposta.status === 401) throw new Error("Token inválido ou expirado");
  if (resposta.status === 404)
    throw new Error(`Repositório "${repo}" não encontrado`);
  if (resposta.status === 403) {
    const reset = resposta.headers.get("X-RateLimit-Reset");
    if (reset) {
      const horario = new Date(reset * 1000);
      throw new Error(`Rate limit atingido. Tente novamente em ${horario}`);
    }
  }
  if (!resposta.ok)
    throw new Error(`HTTP ${resposta.status}: ${resposta.statusText}`);

  const issues = await resposta.json();
  const link = resposta.headers.get("Link");

  const hasNextPage = link?.includes('rel="next"') || false;

  const tarefas = issues.map((issue) => ({
    titulo: issue.title,
    tags: issue.labels.map((label) => label.name),
    descricao: issue.body?.slice(0, 200),
    status: "pendente",
    prioridade: "media",
  }));

  return {
    issues: tarefas,
    hasNextPage,
  };
}
