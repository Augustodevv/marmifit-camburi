// Gera uma migration comparando o banco atual (já migrado) com o schema.
// Uso: npm run db:migrate:new -- nome_da_mudanca
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const name = (process.argv[2] || "").replace(/[^a-z0-9_]/gi, "_");
if (!name) {
  console.error("Informe um nome: npm run db:migrate:new -- adiciona_campo");
  process.exit(1);
}
const sql = execSync("npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script", {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});
if (!sql.trim() || /empty migration/i.test(sql)) {
  console.log("Nenhuma mudança no schema.");
  process.exit(0);
}
const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const dir = `prisma/migrations/${stamp}_${name}`;
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/migration.sql`, sql);
console.log(`Migration criada em ${dir}. Aplique com: npm run db:migrate`);
