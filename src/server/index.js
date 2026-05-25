import http from "http";
import { lerDB, listarTasks } from "../storage/db";

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const rota = url.pathname;
  const metodo = req.method;

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.url === "/") {
    res.write("Hello World");
    res.end();
  }

  if (metodo === "GET" && rota === "/tasks") {
    const start = Date.now();
    try {
      if (
        ["status", "prioridade", "projeto"].some((param) =>
          url.searchParams.has(param),
        )
      ) {
        const filter = url.searchParams.toString().split("&");
        const finalFilter = new Object();

        if (filter.toString().includes("status")) {
          const index = filter.findIndex((a) => a.includes("status"));
          finalFilter.status = filter[index];
        }

        if (filter.toString().includes("prioridade")) {
          const index = filter.findIndex((a) => a.includes("prioridade"));
          finalFilter.prioridade = filter[index];
        }

        if (filter.toString().includes("projeto")) {
          const index = filter.findIndex((a) => a.includes("projeto"));
          finalFilter.projeto = filter[index];
        }

        const tasks = await listarTasks(finalFilter);
        res.writeHead(200);
        const end = Date.now() - start;
        console.log(`[${metodo}] ${rota} -> 200 ${end}ms`);
        return res.end(JSON.stringify(tasks));
      } else {
        const db = await lerDB();
        res.writeHead(200);
        res.end(JSON.stringify(db.tasks));
      }
    } catch (err) {
      res.writeHead(500);
      const end = Date.now() - start;
      console.log(`[${metodo}] ${rota} -> 500 ${end}ms`)
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  if (metodo === "POST" && rota === "/tasks") {
    try {
    } catch (err) {}
  }
});

server.listen(3000);
console.log("server running on port 3000");
