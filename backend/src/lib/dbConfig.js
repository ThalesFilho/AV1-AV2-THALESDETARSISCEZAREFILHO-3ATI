// Monta as opções de conexão do adapter PostgreSQL (driver "pg") a partir da DATABASE_URL.
// ssl=true (banco na nuvem, ex.: Supabase): a conexão usa SSL/TLS.
//  - sem CA: conexão criptografada, sem validar o certificado (o certificado do Supabase é de uma CA própria);
//  - com ca (DATABASE_SSL_CA): conexão criptografada e o certificado do servidor é validado.
// Em variáveis de ambiente as quebras de linha do PEM podem vir como "\n" (texto): convertemos.
export function buildDbConfig(databaseUrl, ssl = false, ca = "") {
  const url = new URL(databaseUrl);
  const sslOptions = ca ? { ca: ca.replace(/\\n/g, "\n") } : { rejectUnauthorized: false };
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    max: 5, // poucas conexões: o plano gratuito do Supabase limita o total
    ...(ssl ? { ssl: sslOptions } : {}),
  };
}
