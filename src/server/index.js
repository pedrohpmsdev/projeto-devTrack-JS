import http from "http";
import { adicionarTask, atualizarTask, lerDB, listarTasks, removerTask } from "../storage/db";

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const rota = url.pathname;
  const metodo = req.method;

  res.setHeader("Content-Type", "application/json; charset=utf-8", "Access-Control-Allow-Origin: *");

  if (req.url === "/") {
    res.write("Hello World");
    res.end();
  }

  if (metodo === "GET" && rota === "/health"){
    res.writeHead(200);
    return res.end(JSON.stringify({status: "ok", uptime: process.uptime()}));
  }

  else if (metodo === "GET" && rota === "/tasks") {
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
        res.writeHead(200, {'content-type':"application/json"});
        const end = Date.now() - start;
        console.log(`[${metodo}] ${rota} -> 200 ${end}ms`);
        return res.end(JSON.stringify(tasks));
      } else {
        const db = await lerDB();
        res.writeHead(200, {'content-type':"application/json"});
        res.end(JSON.stringify(db.tasks));
      }
    } catch (err) {
      res.writeHead(500, {'content-type':"application/json"});
      const end = Date.now() - start;
      console.log(`[${metodo}] ${rota} -> 500 ${end}ms`)
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  else if (metodo === "POST" && rota === "/tasks") {
        const start = Date.now();

    try {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      })

      const bodyJSON = JSON.parse(body);
      const task = await adicionarTask(bodyJSON);

      req.on("end", () => {
        res.writeHead(201, {'content-type':"application/json"});
        const end = Date.now() - start;
        console.log(`[${metodo}] ${rota} -> 201 ${end}ms`);
        res.end(JSON.stringify(task));
      })

    } catch (err) {
      res.writeHead(400, {'content-type':"application/json"});
      const end = Date.now() - start;
      console.log(`[${metodo}] ${rota} -> 400 ${end}ms`)
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  else if (metodo === "PATCH" && rota === "/tasks"){ 
    const start = Date.now();
    try{
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      })

      const bodyJSON = JSON.parse(body);
      const id = url.pathname.split("/")[2];
      const taskUpdated = await atualizarTask(id, bodyJSON);
      req.on("end", () => {
              res.writeHead(200, {'content-type':"application/json"});
              const end = Date.now() - start;
              console.log(`[${metodo}] ${rota} -> 200 ${end}ms`);
              res.end(JSON.stringify(taskUpdated));
            })

          } catch (err) {
            res.writeHead(400, {'content-type':"application/json"});
            const end = Date.now() - start;
            console.log(`[${metodo}] ${rota} -> 400 ${end}ms`)
            return res.end(JSON.stringify({ error: err.message }));
          }
  }

  else if (metodo === "DELETE" && rota === "/tasks"){
    const start = Date.now();
    try {
      const id = url.pathname.split("/")[2];
      await removerTask(id);
      
      req.on("end", () => {
        res.writeHead(200, {'content-type': "application/json"});
        const end = Date.now() - start;
        console.log(`[${metodo}] ${rota} -> 200 ${end}ms`);
        res.end("Task deleted");

      })
    } catch(err){
      res.writeHead(404, {'content-type':"text/plane"});
      const end = Date.now() - start;
      console.log(`[${metodo}] ${rota} -> 404 ${end}ms`);
      return es.end("Task not found");
    }
  }

  else {
    res.writeHead(404, {'content-type':"text/plane"});
    return res.end(JSON.stringify({ error: "Not found" }));
  }
});

server.listen(3000);
console.log("server running on port 3000");
