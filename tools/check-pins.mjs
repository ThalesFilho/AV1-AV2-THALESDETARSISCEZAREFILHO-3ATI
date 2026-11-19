// Confere se as versões "travadas" estão EXATAS no package.json e no package-lock.json.
//   backend : prisma, @prisma/client, @prisma/adapter-mariadb  => 7.10.0
//   frontend: tailwindcss e todo @tailwindcss/*           => 4.3.0
// Pastas sem package.json são ignoradas. Sai com código 1 se algo estiver errado.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let errors = 0;

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

function checkFolder(folder, expected, matches) {
  const dir = path.join(root, folder);
  const pkg = readJson(path.join(dir, "package.json"));
  if (!pkg) {
    console.log(`[${folder}] sem package.json: ignorado`);
    return;
  }
  const lock = readJson(path.join(dir, "package-lock.json"));
  if (!lock) {
    console.log(`  ERRO [${folder}] package-lock.json não existe`);
    errors++;
  }

  const declared = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies, ...pkg.peerDependencies };
  const names = Object.keys(declared).filter(matches);
  console.log(`[${folder}] exigindo ${expected}: ${names.length ? names.join(", ") : "(nenhum pacote encontrado)"}`);

  for (const name of names) {
    // 1) package.json: versão exata, sem ^ ou ~
    if (declared[name] !== expected) {
      console.log(`  ERRO package.json: ${name} = "${declared[name]}" (esperado "${expected}")`);
      errors++;
    }
    if (!lock) continue;
    // 2) package-lock.json: o que o projeto raiz declara e o que foi realmente instalado
    const rootDeclared = { ...lock.packages?.[""]?.dependencies, ...lock.packages?.[""]?.devDependencies };
    if (rootDeclared[name] !== expected) {
      console.log(`  ERRO package-lock.json (raiz): ${name} = "${rootDeclared[name]}" (esperado "${expected}")`);
      errors++;
    }
    const installed = lock.packages?.[`node_modules/${name}`]?.version;
    if (installed !== expected) {
      console.log(`  ERRO package-lock.json (instalado): ${name} = "${installed}" (esperado "${expected}")`);
      errors++;
    }
  }

  // Todo pacote do mesmo grupo que esteja instalado no lock também precisa estar na versão certa.
  if (lock) {
    for (const [key, info] of Object.entries(lock.packages ?? {})) {
      const name = key.replace(/^node_modules\//, "");
      if (key.startsWith("node_modules/") && !name.includes("node_modules/") && matches(name) && info.version !== expected) {
        console.log(`  ERRO package-lock.json: ${name} instalado em ${info.version} (esperado ${expected})`);
        errors++;
      }
    }
  }
}

checkFolder("backend", "7.10.0", (n) => n === "prisma" || n === "@prisma/client" || n === "@prisma/adapter-mariadb");
checkFolder("frontend", "4.3.0", (n) => n === "tailwindcss" || n.startsWith("@tailwindcss/"));

if (errors) {
  console.log(`\nFALHOU: ${errors} problema(s).`);
  process.exit(1);
}
console.log("\nOK: todas as versões estão travadas corretamente.");
