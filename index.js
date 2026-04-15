const http = require("http"),
  fs = require("fs"),
  path = require("path"),
  url = require("url");

const ROOT = __dirname;


http
  .createServer((req, res) => {
    let p = url.parse(req.url).pathname;

    if (p === "/") p = "eventos.html";
    
    const f = path.join(ROOT, p);
    fs.readFile(f, (e, d) => {
      if (e) {
        res.writeHead(404);
        res.end("Not found: " + f);
        return;
      }
      const ext = path.extname(f);
      const types = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".svg": "image/svg+xml",
      };
      res.writeHead(200, { "Content-Type": types[ext] || "text/plain" });
      res.end(d);
    });
  })
  .listen(4200, () =>
    console.log("Servidor corriendo en http://localhost:4200"),
  );
