// Monta as opções de conexão do adapter MariaDB a partir da DATABASE_URL.
// ssl=true (banco na nuvem): conexão com TLS validando o certificado do servidor.
// ca (opcional): certificado da autoridade do provedor, para quem usa CA própria (ex.: Aiven).
// Em variáveis de ambiente as quebras de linha do PEM podem vir como "\n" (texto): convertemos.
export function buildDbConfig(databaseUrl, ssl = false, ca = "") {
  const url = new URL(databaseUrl);
  const sslOptions = ca ? { ca: ca.replace(/\\n/g, "\n") } : true;
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: 10,
    ...(ssl ? { ssl: sslOptions } : {}),
  };
}
