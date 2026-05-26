import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const dataSource = resolve("node_modules/hanzi-writer-data");
const dataOutput = resolve("dist/character-data");

function characterDataPlugin() {
  return {
    name: "local-character-data",
    configureServer(server) {
      server.middlewares.use("/character-data", async (request, response, next) => {
        const filename = decodeURIComponent(request.url.split("?")[0].replace(/^\//, ""));
        if (!/^[\u3400-\u4dbf\u4e00-\u9fff]\.json$/u.test(filename)) {
          next();
          return;
        }

        try {
          const data = await readFile(resolve(dataSource, filename));
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.end(data);
        } catch {
          next();
        }
      });
    },
    async closeBundle() {
      await mkdir(dataOutput, { recursive: true });
      const files = await readdir(dataSource);
      const dataFiles = files.filter((filename) => filename.endsWith(".json"));
      await Promise.all(
        dataFiles.map((filename) => copyFile(resolve(dataSource, filename), resolve(dataOutput, filename))),
      );
    },
  };
}

export default defineConfig({
  root: ".",
  base: "./",
  plugins: [characterDataPlugin()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "esbuild",
  },
  server: {
    port: 5000,
    host: true,
  },
});
